import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/pixelact-ui/avatar";
import {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
} from "@/components/ui/pixelact-ui/menubar";

interface AuthenticatedNavProps {
    username: string;
}

export default function AuthenticatedNav({ username }: AuthenticatedNavProps) {
    const handleLogout = async () => {
        try {
            const authToken = localStorage.getItem('auth_token');
            if (authToken) {
                await fetch(`${import.meta.env.PUBLIC_API_URL}/api/rest/account/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('Logout API call failed:', error);
        }

        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    return (
        <div className="flex items-center space-x-4">
            {/* Stash Button with Menu */}
            <Menubar>
                <MenubarMenu>
                    <MenubarTrigger className="pixel__button pixel-default__button box-shadow-margin text-sm font-medium px-3 py-2 uppercase">
                        STASH
                    </MenubarTrigger>
                    <MenubarContent>
                        <MenubarItem>
                            <a href="/favourites">FAVOURITES</a>
                        </MenubarItem>
                        <MenubarItem>
                            <a href="/seen">SEEN</a>
                        </MenubarItem>
                        <MenubarItem>
                            <a href="/map">MAP</a>
                        </MenubarItem>
                    </MenubarContent>
                </MenubarMenu>
            </Menubar>

            {/* Logout Button */}
            <button
                onClick={handleLogout}
                className="pixel__button pixel-destructive__button box-shadow-margin text-sm font-medium px-4 py-2 uppercase"
            >
                LOGOUT
            </button>
        </div>
    );
}
