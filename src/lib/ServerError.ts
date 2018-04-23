class ServerError extends Error {
    constructor(message: string, readonly status: number, readonly requestedUrl: string) {
        super(message);
    }
}
