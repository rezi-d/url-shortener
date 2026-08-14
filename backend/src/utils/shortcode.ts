import { customAlphabet } from "nanoid";

// Avoid ambiguous chars (0/O, 1/l/I) so codes are easy to read/type.
const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export const generateShortCode = customAlphabet(alphabet, 7);
