export function generateReferralCode(): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const length = 8;
    let result = "REF-";

    for (let i = 0; i < length; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );
    }

    return result;
}

export const handleEvent = async (
    eventName: string,
    contractDetails: {
        eventHandlers: Record<
            string,
            (
                eventName: string,
                contractDetails: any,
                event: any,
                provider: any
            ) => Promise<void>
        >;
    },
    event: any,
    provider: any
): Promise<void> => {
    const handler = contractDetails.eventHandlers[eventName];
    if (handler) {
        await handler(eventName, contractDetails, event, provider);
    } else {
        console.log(`No handler found for event: ${eventName}`);
    }
};
