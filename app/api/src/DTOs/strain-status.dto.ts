export interface StrainStatusRequest {
    strain_names: string[]; // Array of strain names to check
}

export interface StrainStatusItem {
    strain_name: string;
    is_liked: boolean;
    is_seen: boolean;
}

export interface StrainStatusResponse {
    success: boolean;
    data: StrainStatusItem[];
    message?: string;
}

// For single strain status check
export interface SingleStrainStatusRequest {
    strain_name: string;
}

export interface SingleStrainStatusResponse {
    success: boolean;
    data: StrainStatusItem;
    message?: string;
}
