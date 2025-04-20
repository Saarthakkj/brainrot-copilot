import { useState, useEffect, useRef } from 'react';

// Function to parse URL-encoded data
const parseUrlEncoded = (str) => {
    const result = {};
    const pairs = str.split('&');
    
    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i].split('=');
        result[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    
    return result;
};

// Function to parse the YouTube timed text data in different formats
const parseTimedText = (content, format) => {
    console.log('[YouTube Captions] Parsing caption data in format:', format);
    const captions = [];
    
    try {
        // First try to determine if it's XML or JSON format
        if (content.trim().startsWith('<')) {
            // XML format
            console.log('[YouTube Captions] Content appears to be XML format');
            return parseXmlTimedText(content);
        } else if (content.includes('{"captionTracks":') || content.includes('{"events":')) {
            // Try to parse as JSON
            console.log('[YouTube Captions] Content appears to be JSON format');
            return parseJsonTimedText(content);
        } else {
            // Unknown format - log a sample to help debug
            console.log('[YouTube Captions] Unknown format. Content start:', content.substring(0, 100));
            throw new Error('Unsupported caption format');
        }
    } catch (err) {
        console.error('[YouTube Captions] Error parsing caption data:', err);
        console.log('[YouTube Captions] Content sample:', content.substring(0, 200));
        return [];
    }
};

// Parse XML formatted captions
const parseXmlTimedText = (xmlText) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // Check if this is a parse error
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
        console.error('[YouTube Captions] XML parse error:', parseError.textContent);
        throw new Error('Failed to parse XML');
    }
    
    const texts = xmlDoc.getElementsByTagName('text');
    console.log('[YouTube Captions] Found', texts.length, 'text elements in XML');
    
    const captions = [];
    for (let i = 0; i < texts.length; i++) {
        const textNode = texts[i];
        const start = parseFloat(textNode.getAttribute('start'));
        const dur = parseFloat(textNode.getAttribute('dur') || '5'); // Default duration if missing
        const text = textNode.textContent || '';
        
        if (!isNaN(start) && text.trim()) {
            captions.push({ 
                start, 
                dur, 
                text: text.replace(/\<[^>]*>/g, '').replace(/\n/g, ' ').trim() 
            });
        }
    }
    
    // Sort captions by start time
    captions.sort((a, b) => a.start - b.start);
    console.log('[YouTube Captions] Extracted', captions.length, 'captions from XML');
    return captions;
};

// Parse JSON formatted captions
const parseJsonTimedText = (jsonText) => {
    try {
        let data;
        // Try to parse the JSON
        try {
            data = JSON.parse(jsonText);
        } catch (e) {
            // If direct parsing fails, try to extract JSON from the response
            const jsonMatch = jsonText.match(/(\{.*\})/);
            if (jsonMatch && jsonMatch[1]) {
                data = JSON.parse(jsonMatch[1]);
            } else {
                throw new Error('Failed to extract JSON data');
            }
        }
        
        const captions = [];
        
        // Handle srv3 format
        if (data.events) {
            console.log('[YouTube Captions] Parsing srv3 format with', data.events.length, 'events');
            
            data.events.forEach(event => {
                if (event.segs && event.tStartMs !== undefined) {
                    const start = event.tStartMs / 1000;
                    const dur = ((event.dDurationMs || 5000) / 1000);
                    
                    // Concatenate all segments to form the full text
                    let text = '';
                    event.segs.forEach(seg => {
                        if (seg.utf8) text += seg.utf8;
                    });
                    
                    if (text.trim()) {
                        captions.push({
                            start,
                            dur,
                            text: text.replace(/\n/g, ' ').trim()
                        });
                    }
                }
            });
        } 
        // Handle json3 format
        else if (data.timedtext) {
            console.log('[YouTube Captions] Parsing json3 format');
            
            const events = data.timedtext.body.events;
            if (events && events.length) {
                events.forEach(event => {
                    if (event.tStartMs !== undefined) {
                        const start = event.tStartMs / 1000;
                        const dur = ((event.dDurationMs || 5000) / 1000);
                        let text = '';
                        
                        if (event.segs) {
                            event.segs.forEach(seg => {
                                if (seg.utf8) text += seg.utf8;
                            });
                        }
                        
                        if (text.trim()) {
                            captions.push({
                                start,
                                dur,
                                text: text.replace(/\n/g, ' ').trim()
                            });
                        }
                    }
                });
            }
        }
        
        // Sort captions by start time
        captions.sort((a, b) => a.start - b.start);
        console.log('[YouTube Captions] Extracted', captions.length, 'captions from JSON');
        return captions;
    } catch (err) {
        console.error('[YouTube Captions] Error parsing JSON data:', err);
        return [];
    }
};


export const useYoutubeCaptions = (videoId) => {
    const [captions, setCaptions] = useState([]);
    const [currentCaption, setCurrentCaption] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const captionIndexRef = useRef(0);
    const timeoutRef = useRef(null);

    useEffect(() => {
        if (!videoId) {
            setCaptions([]);
            setCurrentCaption('');
            setError(null);
            setIsLoading(false);
            return;
        }        const fetchCaptions = async () => {
            setIsLoading(true);
            setError(null);
            setCaptions([]);
            setCurrentCaption('');
            captionIndexRef.current = 0;
            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            try {
                // Step 1: Get video info with caption tracks information
                console.log('[YouTube Captions] Fetching video info for caption tracks...');
                const videoInfoUrl = `https://www.youtube.com/watch?v=${videoId}`;
                console.log(`[YouTube Captions] Fetching from: ${videoInfoUrl}`);
                
                const videoPageResponse = await fetch(videoInfoUrl);
                if (!videoPageResponse.ok) {
                    throw new Error(`Failed to fetch video page (Status: ${videoPageResponse.status})`);
                }
                
                const videoPageHtml = await videoPageResponse.text();
                
                // Find the ytInitialPlayerResponse in the HTML
                const ytInitialPlayerResponseRegex = /ytInitialPlayerResponse\s*=\s*({.+?});/;
                const match = videoPageHtml.match(ytInitialPlayerResponseRegex);
                
                if (!match || !match[1]) {
                    throw new Error('Could not find player response data in the YouTube page');
                }
                
                let playerResponse;
                try {
                    playerResponse = JSON.parse(match[1]);
                } catch (e) {
                    throw new Error('Failed to parse player response data');
                }
                
                // Get caption tracks from playerResponse
                const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
                
                if (!captionTracks || captionTracks.length === 0) {
                    console.warn('[YouTube Captions] No caption tracks found in player response');
                    throw new Error('No captions available for this video');
                }
                
                // Log available caption tracks for debugging
                console.log(`[YouTube Captions] Found ${captionTracks.length} caption tracks:`);
                captionTracks.forEach((track, i) => {
                    console.log(`Track ${i+1}: ${track.name?.simpleText || 'Unnamed'} (${track.languageCode})`);
                });
                
                // Look for English captions first, then fall back to first available track
                let captionTrack = captionTracks.find(track => 
                    track.languageCode === 'en' || track.vssId === 'a.en' || track.name?.simpleText?.includes('English')
                );
                
                // If no English track found, try to get any track
                if (!captionTrack && captionTracks.length > 0) {
                    console.log('[YouTube Captions] No English track found, using first available track');
                    captionTrack = captionTracks[0];
                }
                
                if (!captionTrack) {
                    throw new Error('Could not find a usable caption track');
                }
                
                console.log(`[YouTube Captions] Selected track: ${captionTrack.name?.simpleText || 'Unnamed'} (${captionTrack.languageCode})`);                // Prepare the base URL for captions
                const baseUrl = captionTrack.baseUrl;
                console.log('[YouTube Captions] Base caption URL:', baseUrl);

                // Try different formats in order of preference
                const formats = ['srv3', 'json3', '']; // '' means default format (usually XML)
                let parsedCaptions = [];
                let formatTried = '';
                
                for (const format of formats) {
                    try {
                        // Construct URL with the current format
                        let timedTextUrl = baseUrl;
                        if (format && !baseUrl.includes('&fmt=')) {
                            timedTextUrl += `&fmt=${format}`;
                        }
                        
                        formatTried = format || 'default';
                        console.log(`[YouTube Captions] Trying format: ${formatTried}, URL:`, timedTextUrl);
                        
                        // Fetch captions with this format
                        const response = await fetch(timedTextUrl);
                        if (!response.ok) {
                            console.warn(`[YouTube Captions] Failed with format ${formatTried}:`, response.status);
                            continue; // Try next format
                        }

                        const content = await response.text();
                        if (!content) {
                            console.warn(`[YouTube Captions] Empty content received with format ${formatTried}`);
                            continue; // Try next format
                        }

                        // Log the beginning of the content to help debug
                        console.log(`[YouTube Captions] Received content (${formatTried}) starts with:`, 
                            content.substring(0, 100).replace(/\n/g, ' '));
                        
                        // Parse the captions
                        parsedCaptions = parseTimedText(content, formatTried);
                        
                        // If we successfully got captions, stop trying other formats
                        if (parsedCaptions.length > 0) {
                            console.log(`[YouTube Captions] Successfully parsed ${parsedCaptions.length} captions with format ${formatTried}`);
                            break;
                        } else {
                            console.warn(`[YouTube Captions] No captions found with format ${formatTried}`);
                        }
                    } catch (error) {
                        console.error(`[YouTube Captions] Error fetching/parsing with format ${formatTried}:`, error);
                    }
                }

                // Check results after trying all formats
                if (parsedCaptions.length === 0) {
                    console.warn('[YouTube Captions] No captions found after trying all formats');
                    throw new Error('No captions could be extracted from this video');
                } else {
                    setCaptions(parsedCaptions);
                    console.log(`[YouTube Captions] Successfully loaded ${parsedCaptions.length} caption entries`);
                }

            } catch (err) {
                console.error('[ERROR] Failed to fetch or parse YouTube captions:', err);
                setError(`Failed to load captions: ${err.message}`);
                setCaptions([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCaptions();

        // Cleanup function
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [videoId]);

    // Effect to update the current caption based on time
    useEffect(() => {
        if (captions.length === 0 || isLoading) {
            setCurrentCaption(''); // Clear caption if none loaded or still loading
            return;
        }

        const scheduleNextCaption = () => {
            if (captionIndexRef.current >= captions.length) {
                setCurrentCaption(''); // End of captions
                return;
            }

            const current = captions[captionIndexRef.current];
            const next = captions[captionIndexRef.current + 1];

            // Display current caption
            setCurrentCaption(current.text);

            // Calculate when the next caption should start
            const displayDuration = current.dur * 1000; // Duration to show the current caption
            let timeUntilNext = displayDuration;

            if (next) {
                 // More precise timing if next caption exists
                 const gap = (next.start - (current.start + current.dur)) * 1000;
                 timeUntilNext = displayDuration + Math.max(0, gap); // Show for its duration + gap
            }


            // Schedule the next update
            timeoutRef.current = setTimeout(() => {
                captionIndexRef.current++;
                scheduleNextCaption();
            }, timeUntilNext);
        };

        // Start the caption scheduling
        captionIndexRef.current = 0; // Reset index when captions change
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        scheduleNextCaption(); // Start the process

        // Cleanup on unmount or when captions/loading state changes
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
             setCurrentCaption(''); // Clear caption on cleanup
        };
    }, [captions, isLoading]); // Rerun when captions are loaded or loading state changes

    return {
        currentCaption,
        isLoading,
        error,
    };
};
