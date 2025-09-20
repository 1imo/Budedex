import React, { useState, useEffect } from 'react';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from './ui/pixelact-ui/command';
import { searchStrains } from '../services/graphql';

interface SearchCommandProps {
    className?: string;
}

interface StrainResult {
    id: string;
    name: string;
    strain_type?: string;
    rating?: number;
    positive_effects?: string[];
}

export default function SearchCommand({ className }: SearchCommandProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<StrainResult[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const searchDebounced = setTimeout(async () => {
            if (query.trim().length > 1) {
                setLoading(true);
                try {
                    const response = await searchStrains(query, 1, 5);
                    setResults(response.searchStrains?.strains || []);
                } catch (error) {
                    console.error('Search failed:', error);
                    setResults([]);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(searchDebounced);
    }, [query]);

    const handleSelect = (strainId: string) => {
        window.location.href = `/strains/${strainId}`;
    };

    return (
        <Command className={className}>
            <CommandInput
                placeholder="SEARCH STRAINS..."
                value={query}
                onValueChange={setQuery}
            />
            <CommandList>
                {loading && (
                    <div className="px-4 py-2 text-xs uppercase">SEARCHING...</div>
                )}

                {!loading && query.trim().length > 1 && results.length === 0 && (
                    <CommandEmpty>NO STRAINS FOUND</CommandEmpty>
                )}

                {!loading && results.length > 0 && (
                    <CommandGroup heading="STRAINS">
                        {results.map((strain) => (
                            <CommandItem
                                key={strain.id}
                                value={strain.name}
                                onSelect={() => handleSelect(strain.id)}
                                className="cursor-pointer"
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-xs uppercase">{strain.name}</span>
                                        {strain.strain_type && (
                                            <span className="text-xs text-muted-foreground uppercase">
                                                {strain.strain_type === 'Unknown' ? 'HYBRID' : strain.strain_type}
                                            </span>
                                        )}
                                    </div>
                                    {strain.rating && (
                                        <span className="text-xs text-muted-foreground">
                                            {strain.rating.toFixed(1)}/5
                                        </span>
                                    )}
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {!loading && query.trim().length > 1 && results.length > 0 && (
                    <CommandGroup>
                        <CommandItem
                            value="view-all"
                            onSelect={() => window.location.href = `/search?q=${encodeURIComponent(query)}`}
                            className="cursor-pointer border-t border-border"
                        >
                            <span className="text-xs font-bold uppercase">VIEW ALL RESULTS →</span>
                        </CommandItem>
                    </CommandGroup>
                )}
            </CommandList>
        </Command>
    );
}

