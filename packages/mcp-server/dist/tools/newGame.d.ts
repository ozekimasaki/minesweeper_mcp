import * as z from 'zod/v4';
export declare const newGameTool: {
    name: string;
    schema: {
        title: string;
        description: string;
        inputSchema: z.ZodObject<{
            difficulty: z.ZodOptional<z.ZodEnum<{
                beginner: "beginner";
                intermediate: "intermediate";
                advanced: "advanced";
            }>>;
        }, z.core.$strip>;
    };
    handler: (args: {
        difficulty?: "beginner" | "intermediate" | "advanced";
    }, sessionId: string) => Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
};
