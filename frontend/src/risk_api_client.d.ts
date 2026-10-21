export declare function checkBackendHealth(): Promise<{ status: string; [key: string]: any }>;

export declare function assessRisk(
  domain: 'banks' | 'lenders' | 'insurers' | 'creditfraud' | 'insurance',
  userInput: Record<string, any>,
  includeAiReasoning?: boolean
): Promise<any>;

export declare function verifySecurityPipeline(payload: {
  client_id: string;
  payload_type: string;
  epsilon?: number;
  round_id?: number;
  sample_count?: number;
}): Promise<any>;

