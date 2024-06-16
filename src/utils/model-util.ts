export const voiceNameFormat = (shortName: string) => {
    if (!shortName) {
        return undefined
    }
    return shortName.substring(shortName.lastIndexOf('-') + 1).replace('Neural', '')
}