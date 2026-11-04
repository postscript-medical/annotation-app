# Server data

## common-passwords.txt

The fallback breached-password list used by `../password.ts` when the Have I Been Pwned range API
is unreachable or slower than 2 seconds. One entry per line, NFKC-normalised and lower-cased.

Built by `scripts/build-common-passwords.mjs` from the 1,000,000 most common entries of SecLists
`Passwords/Common-Credentials/Pwdb_top-10000000.txt`, keeping only entries of at least 15 code
points and at most 72 bytes (anything shorter fails the length rule anyway).

Source: [SecLists](https://github.com/danielmiessler/SecLists), MIT License:

> MIT License
>
> Copyright (c) 2018 Daniel Miessler
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software
> and associated documentation files (the "Software"), to deal in the Software without
> restriction, including without limitation the rights to use, copy, modify, merge, publish,
> distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
> Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or
> substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
> BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
> NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
> DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
