import bcrypt from 'bcrypt';

export async function encrypter(rawData: string): Promise<string> {
    const salt = await bcrypt.genSalt(10)
    const encryptedData = await bcrypt.hash(rawData, salt)
    return encryptedData;
}

// a funtion to decrypt the data
export async function decrypter(rawData: string, encryptedData: string): Promise<boolean> {
    const isMatch = await bcrypt.compare(rawData, encryptedData)
    return isMatch;
}