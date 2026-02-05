import * as z from 'zod/v4';
export declare const flagCellTool: {
    name: string;
    schema: {
        title: string;
        description: string;
        inputSchema: z.ZodObject<{
            row: z.ZodNumber;
            col: z.ZodNumber;
        }, z.core.$strip>;
    };
    handler: ({ row, col }: {
        row: number;
        col: number;
    }, sessionId: string) => Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
};
