const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:4003';

export async function signUp(data: { username: string; password: string; confirmPassword: string }) {
    const res = await fetch(`${API_BASE_URL}/api/rest/account/sign-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Sign-up failed");
    }

    return res.json();
}

export async function signIn(data: { username: string; password: string }) {
    const res = await fetch(`${API_BASE_URL}/api/rest/account/sign-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Sign-in failed");
    }

    return res.json();
}

export async function addToFavourites(strainName: string, token: string) {
    const res = await fetch(`${API_BASE_URL}/api/rest/account/favourites`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ strain_name: strainName })
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add to favourites");
    }

    return res.json();
}

export async function addToWishlist(strainId: string, token: string) {
    const res = await fetch(`${API_BASE_URL}/api/rest/account/wishlist`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ strainId })
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add to wishlist");
    }

    return res.json();
}

export async function markAsComplete(strainName: string, token: string) {
    const res = await fetch(`${API_BASE_URL}/api/rest/account/complete`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ strain_name: strainName })
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to mark as complete");
    }

    return res.json();
}

export async function getUserProfile(token: string) {
    const res = await fetch(`${API_BASE_URL}/api/rest/account/profile`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch user profile");
    }

    return res.json();
}
