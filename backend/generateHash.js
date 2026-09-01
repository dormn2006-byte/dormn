import bcrypt from "bcrypt";

const hashedPassword = await bcrypt.hash("77425", 10);

console.log(hashedPassword);