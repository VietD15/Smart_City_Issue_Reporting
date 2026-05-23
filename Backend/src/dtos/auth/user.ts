export interface UsersResponse {
    user_id: string;
    username: string;
    name?: string | null;
    email: string;
    avatar?: string | null;
    phone?: string | null;
    city?: string | null;
    roles: string[];
    role?: string | null;
    lockEnd ?: Date | null;
    lockReason ?: string | null;
    managementScope?: string[];
    created_at: Date;
    updated_at: Date;
}