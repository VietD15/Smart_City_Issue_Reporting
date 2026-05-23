import { UsersResponse } from "../../dtos/auth/user";

export class UserMapper {
        static toUsersResponse(user: any): UsersResponse {
            return {
                user_id: user._id,
                username: user.userName,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                phone: user.phone,
                city: user.city,
                role: user.role,
                roles: user.roles || [],
                lockEnd: user.lockEnd,
                lockReason: user.lockReason,
                managementScope: user.managementScope || [],
                created_at: user.createdAt,
                updated_at: user.updatedAt
            };
        }

        static toUserResponse(user: any, role: string[]): UsersResponse {
            return {
                user_id: user._id,
                username: user.userName,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                phone: user.phone,
                city: user.city,
                role: user.role,
                roles: role || [],
                lockEnd: user.lockEnd,
                lockReason: user.lockReason,
                managementScope: user.managementScope || [],
                created_at: user.createdAt,
                updated_at: user.updatedAt
            };
        }
}