import React, { useState, useEffect } from 'react';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from './ui/pixelact-ui/hover-card';
import { getStrain } from '../services/graphql';

interface StrainHoverCardProps {
    strainName: string;
    href: string;
    className?: string;
    children: React.ReactNode;
}

interface StrainData {
    name: string;
    strain_type?: string;
    rating?: number;
    thc_content?: string;
    positive_effects?: string[];
    flavors?: string[];
    image_path?: string;
}

export default function StrainHoverCard({ strainName, href, className, children }: StrainHoverCardProps) {
    const [strainData, setStrainData] = useState<StrainData | null>(null);
    const [loading, setLoading] = useState(false);

    const loadStrainData = async () => {
        if (strainData || loading) return;

        setLoading(true);
        try {
            const slug = strainName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim();
            const result = await getStrain(slug);
            if (result?.strain) {
                setStrainData(result.strain);
            }
        } catch (error) {
            console.error('Failed to load strain data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <HoverCard>
            <HoverCardTrigger asChild>
                <a
                    href={href}
                    className={className}
                    onMouseEnter={loadStrainData}
                >
                    {children}
                </a>
            </HoverCardTrigger>
            <HoverCardContent
                className="text-center w-full !bg-white !border-0 !rounded-none !p-3 pixel-font"
                style={{
                    width: 'var(--radix-hover-card-trigger-width)',
                    boxShadow: 'rgb(0, 0, 0) -4px 0px 0px 0px, rgb(0, 0, 0) 4px 0px 0px 0px, rgb(0, 0, 0) 0px 4px 0px 0px, rgb(0, 0, 0) 0px -4px 0px 0px, rgb(200, 200, 200) -4px 0px 0px 0px inset, rgb(200, 200, 200) 0px -4px 0px 0px inset',
                    margin: '4px'
                }}
                sideOffset={4}
            >
                {loading ? (
                    <div className="text-xs uppercase">LOADING...</div>
                ) : strainData ? (
                    <div className="space-y-1">
                        <div className="font-bold uppercase text-xs">{strainData.name}</div>
                        {strainData.rating && (
                            <div className="text-xs">{strainData.rating.toFixed(1)} / 5</div>
                        )}
                        {strainData.strain_type && (
                            <div className="text-xs uppercase">
                                {strainData.strain_type === 'Unknown' ? 'HYBRID' : strainData.strain_type}
                            </div>
                        )}
                        {strainData.positive_effects && strainData.positive_effects.length > 0 && (
                            <div>
                                <p className="text-xs font-bold uppercase">TOP EFFECTS:</p>
                                {strainData.positive_effects.slice(0, 2).map((effect: string) => (
                                    <div key={effect} className="text-xs">{effect}</div>
                                ))}
                            </div>
                        )}
                        {strainData.flavors && strainData.flavors.length > 0 && (
                            <div>
                                <p className="text-xs font-bold uppercase">FLAVORS:</p>
                                {strainData.flavors.slice(0, 2).map((flavor: string) => (
                                    <div key={flavor} className="text-xs">{flavor}</div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-xs uppercase">NOT FOUND</div>
                )}
            </HoverCardContent>
        </HoverCard>
    );
}
