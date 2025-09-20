export interface SignUpDto {
    username: string;
    password: string;
    confirmPassword: string;
}

export interface SignInDto {
    username: string;
    password: string;
}

export interface AuthResponseDto {
    token: string;
    user: {
        id: string;
        username: string;
    };
}

export interface FavouriteDto {
    strain_name: string;
}

export interface WishlistDto {
    strain_name: string;
}

export interface CompleteDto {
    strain_name: string;
}
