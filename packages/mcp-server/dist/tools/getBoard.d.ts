import * as z from 'zod/v4';
export declare const getBoardTool: {
    name: string;
    schema: {
        title: string;
        description: string;
        inputSchema: z.ZodObject<{}, z.core.$strip>;
    };
    handler: (_args: Record<string, never>, sessionId: string) => Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
};
