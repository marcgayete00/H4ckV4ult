#!/usr/bin/env python3
"""
pyaes_bruteforce.py
Brute-force (wordlist) cracker for files encrypted with pyAesCrypt.
USO: solo en entornos autorizados / laboratorio.
Instalación:
    python3 -m venv venv && source venv/bin/activate
    pip install pyAesCrypt
Ejecución:
    python3 pyaes_bruteforce.py -i file.zip.aes -w /path/wordlist.txt -t 4
"""
import argparse
import pyAesCrypt
import tempfile
import os
import sys
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path
import signal

BUFFER_SIZE = 64 * 1024  # ajusta si sabes que se usó otro buffer
TIMEOUT = None  # si quisieras limitar tiempo por intento (no usado aquí)

def try_password(args):
    """
    Worker function executed in a separate process.
    args is tuple: (infile, pw, buffer_size)
    Returns (pw, tmpname) on probable success, None on failure, or ("ERROR", msg)
    """
    infile, pw, buffer_size = args
    pw = pw.rstrip("\n")
    # create a temp file path
    fd, tmpname = tempfile.mkstemp(prefix="pyaes_try_", suffix=".zip")
    os.close(fd)
    try:
        # Attempt decrypt: raises ValueError on bad pw or corrupt
        pyAesCrypt.decryptFile(infile, tmpname, pw, buffer_size)
        # read first bytes
        with open(tmpname, "rb") as fh:
            hdr = fh.read(4)
        if hdr.startswith(b"PK\x03\x04"):
            return (pw, tmpname)
        else:
            # not a ZIP header -> likely wrong pw or different payload
            try:
                os.remove(tmpname)
            except Exception:
                pass
            return None
    except ValueError:
        # wrong password or file corrupt
        try:
            os.remove(tmpname)
        except Exception:
            pass
        return None
    except Exception as e:
        try:
            os.remove(tmpname)
        except Exception:
            pass
        return ("ERROR", str(e))


def chunked_lines(path, start_line=0):
    """Generator (index, line) from start_line (1-based)."""
    with open(path, "r", encoding="utf-8", errors="ignore") as fh:
        for i, line in enumerate(fh, 1):
            if i < start_line:
                continue
            yield i, line.rstrip("\n")


def main():
    parser = argparse.ArgumentParser(description="pyaescrypt .aes wordlist cracker (lab only)")
    parser.add_argument("-i", "--infile", required=True, help="input .zip.aes file (pyAesCrypt format)")
    parser.add_argument("-w", "--wordlist", required=True, help="wordlist file (one password per line)")
    parser.add_argument("-t", "--workers", type=int, default=4, help="number of parallel workers (default 4)")
    parser.add_argument("-s", "--start", type=int, default=1, help="line number in wordlist to start from (1-based)")
    parser.add_argument("-o", "--out", default="found_decrypted.zip", help="output filename when found")
    parser.add_argument("--buffer", type=int, default=BUFFER_SIZE, help="pyAesCrypt buffer size (bytes)")
    parser.add_argument("--max", type=int, default=0, help="max number of tries (0 = all)")
    args = parser.parse_args()

    infile = args.infile
    wordlist = args.wordlist
    workers = max(1, args.workers)
    start_line = max(1, args.start)
    out_on_found = args.out
    buffer_size = args.buffer
    max_tries = args.max if args.max > 0 else None

    if not Path(infile).exists():
        print("Input file not found:", infile); sys.exit(2)
    if not Path(wordlist).exists():
        print("Wordlist not found:", wordlist); sys.exit(2)

    total_tried = 0
    print(f"[+] Target: {infile}")
    print(f"[+] Wordlist: {wordlist} (starting at line {start_line})")
    print(f"[+] Workers: {workers}")

    # allow graceful shutdown with Ctrl+C
    stop_signal = False
    def handler(sig, frame):
        nonlocal stop_signal
        stop_signal = True
        print("\n[!] SIGINT received, waiting for workers to finish current attempts...")
    signal.signal(signal.SIGINT, handler)

    # prepare executor and submit initial batch
    with ProcessPoolExecutor(max_workers=workers) as exe:
        futures = {}
        try:
            for i, pw in chunked_lines(wordlist, start_line):
                if stop_signal:
                    break
                if max_tries and total_tried >= max_tries:
                    break
                total_tried += 1
                fut = exe.submit(try_password, (infile, pw, buffer_size))
                futures[fut] = (i, pw)
                # throttle submissions slightly if queue grows (optional)
                # handle completed futures as they come
                if len(futures) >= workers * 4:
                    # wait for at least one to complete
                    done, _ = as_completed(futures).__next__(), None

                # process completed futures non-blocking
                done_list = [f for f in futures if f.done()]
                for fut_done in done_list:
                    res = fut_done.result()
                    i_done, pw_done = futures.pop(fut_done)
                    if res is None:
                        if i_done % 1000 == 0:
                            print(f"[i] tried {i_done} passwords; last: {pw_done[:30]}...")
                        continue
                    if isinstance(res, tuple) and res[0] == "ERROR":
                        print("[!] Worker error:", res[1])
                        continue
                    # success
                    found_pw, tmpname = res
                    print("\n[+] PASSWORD FOUND:", found_pw)
                    try:
                        os.replace(tmpname, out_on_found)
                        print(f"[+] Decrypted file written to: {out_on_found}")
                    except Exception:
                        print("[!] Could not move temp file to final location.")
                        print("    Tempfile left at:", tmpname)
                    # shutdown executor and exit
                    exe.shutdown(wait=False, cancel_futures=True)
                    return 0

            # after submitting all, wait remaining futures
            for fut in as_completed(futures):
                i_done, pw_done = futures[fut]
                res = fut.result()
                if res is None:
                    continue
                if isinstance(res, tuple) and res[0] == "ERROR":
                    print("[!] Worker error:", res[1])
                    continue
                found_pw, tmpname = res
                print("\n[+] PASSWORD FOUND:", found_pw)
                try:
                    os.replace(tmpname, out_on_found)
                    print(f"[+] Decrypted file written to: {out_on_found}")
                except Exception:
                    print("[!] Could not move temp file to final location.")
                    print("    Tempfile left at:", tmpname)
                return 0

            print("[*] Finished wordlist (no password found).")
            return 1
        except KeyboardInterrupt:
            print("\n[!] Interrupted by user. Exiting.")
            return 2


if __name__ == "__main__":
    sys.exit(main())
