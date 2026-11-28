export declare function readLimitedBody(
  request: Pick<Request, "headers" | "body">,
  maxBytes: number,
): Promise<string | null>;
