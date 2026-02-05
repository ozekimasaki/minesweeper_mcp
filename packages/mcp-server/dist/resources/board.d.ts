export declare const boardResource: {
    name: string;
    uriTemplate: string;
    schema: {
        title: string;
        description: string;
        mimeType: string;
    };
    handler: (uri: URL, sessionId: string) => Promise<{
        contents: {
            uri: string;
            text: string;
        }[];
    }>;
};
