'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  PlayIcon, 
  MusicalNoteIcon,
  SpeakerWaveIcon,
  HeartIcon,
  ShareIcon,
  ArrowTopRightOnSquareIcon,
  ForwardIcon,
  BackwardIcon
} from '@heroicons/react/24/outline';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

// YouTube API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// Your actual YouTube videos - titles and descriptions will be fetched from YouTube
// Default videos (fallback if no admin videos are set)
const defaultVideos = [
  {
    id: 'zMhW5jhYZFc',
  },
  {
    id: 'FWxhf2dS9Ok',
  },
  {
    id: 'sPEJJsie9uw',
  },
  {
    id: 'lhp1xiS4KCs',
  },
  {
    id: 'oxnfHQEpiBg',
  },
  {
    id: 'SvrlmXpbp9s',
  },
];

interface VideoData {
  title: string;
  author_name: string;
  thumbnail_url: string;
}

interface Video {
  id: string;
}

// Built-in Music Player Component
const MusicPlayer = ({ videos }: { videos: Video[] }) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videoData, setVideoData] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentKey, setCurrentKey] = useState(0); // Force iframe reload
  const [autoAdvance, setAutoAdvance] = useState(true); // Auto-advance to next video
  const [showNextButton, setShowNextButton] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [shareMessage, setShareMessage] = useState('');
  
  const currentVideo = videos[currentVideoIndex];
  const currentVideoData = videoData[currentVideoIndex];
  
  // Safety check to ensure data consistency
  useEffect(() => {
    if (currentVideo && currentVideoData) {
      console.log('Current video check:');
      console.log('Video ID:', currentVideo.id);
      console.log('Video data title:', currentVideoData.title);
      console.log('Index:', currentVideoIndex);
      console.log('Videos length:', videos.length);
      console.log('VideoData length:', videoData.length);
    }
  }, [currentVideoIndex, currentVideo, currentVideoData, videos.length, videoData.length]);
  
  // Fetch video data from YouTube oEmbed API (this gets real titles)
  const fetchVideoData = async (videoId: string): Promise<VideoData> => {
    try {
      const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (response.ok) {
        const data = await response.json();
        return {
          title: data.title,
          author_name: data.author_name,
          thumbnail_url: data.thumbnail_url,
        };
      }
    } catch (error) {
      console.error('Error fetching video data:', error);
    }
    return {
      title: `Video ${videoId}`,
      author_name: 'Grant Matai Cross',
      thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    };
  };
  
  // Load all video data on component mount
  useEffect(() => {
    const loadVideoData = async () => {
      console.log('Loading video data for videos:', videos.map(v => v.id));
      setLoading(true);
      setVideoData([]); // Clear existing data first
      
      const dataPromises = videos.map(async (video, index) => {
        console.log(`Fetching data for video ${index}:`, video.id);
        const data = await fetchVideoData(video.id);
        console.log(`Got data for video ${index}:`, data.title);
        return data;
      });
      
      const results = await Promise.all(dataPromises);
      console.log('All video data loaded:', results.map(r => r.title));
      setVideoData(results);
      setLoading(false);
    };

    if (videos.length > 0) {
      loadVideoData();
    }
  }, [videos]); // Re-run when videos array changes

  // Load YouTube Player API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load YouTube API if not already loaded
    if (!window.YT) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.body.appendChild(script);

      window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube API loaded');
        initializePlayer();
      };
    } else {
      initializePlayer();
    }
  }, [currentVideo.id, currentKey]);

  const initializePlayer = () => {
    if (!window.YT || !window.YT.Player) {
      console.log('YouTube API not ready yet');
      return;
    }

    // Destroy old player if it exists
    if (player) {
      console.log('Destroying old player');
      try {
        player.destroy();
      } catch (error) {
        console.log('Error destroying old player:', error);
      }
      setPlayer(null);
    }

    console.log('Initializing YouTube player for video:', currentVideo.id);
    
    try {
      const newPlayer = new window.YT.Player(`youtube-player-${currentKey}`, {
        height: '100%',
        width: '100%',
        videoId: currentVideo.id,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          controls: 1,
          autoplay: isPlaying ? 1 : 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            console.log('Player ready for video:', currentVideo.id);
            setPlayer(event.target);
          },
          onStateChange: (event: any) => {
            console.log('Player state changed:', event.data, 'for video:', currentVideo.id);
            
            // Check if the video that's actually playing matches our current index
            if (event.target && event.target.getVideoData) {
              const actualVideoId = event.target.getVideoData().video_id;
              console.log('Actually playing video ID:', actualVideoId);
              console.log('Expected video ID:', currentVideo.id);
              console.log('Current index:', currentVideoIndex);
              console.log('Videos array:', videos.map(v => v.id));
              console.log('Video data array:', videoData.map(d => d.title));
              
              // Find the correct index for the actually playing video
              const actualIndex = videos.findIndex(v => v.id === actualVideoId);
              console.log('Found actual index:', actualIndex);
              
              if (actualIndex !== -1 && actualIndex !== currentVideoIndex) {
                console.log('Syncing current index from', currentVideoIndex, 'to', actualIndex);
                setCurrentVideoIndex(actualIndex);
              } else if (actualIndex === -1) {
                console.warn('Playing video not found in current playlist!', actualVideoId);
              }
            }
            
            // YT.PlayerState.ENDED = 0
            if (event.data === 0 && videos.length > 1) {
              console.log('Video ended!');
              if (autoAdvance) {
                handleVideoEnd();
              } else {
                setShowNextButton(true);
              }
            }
          },
          onError: (event: any) => {
            console.error('YouTube player error:', event.data);
          }
        },
      });
    } catch (error) {
      console.error('Error creating YouTube player:', error);
    }
  };

  const handleVideoEnd = () => {
    setTimeout(() => {
      const newIndex = (currentVideoIndex + 1) % videos.length;
      console.log('Advancing from video', currentVideoIndex, 'to', newIndex);
      console.log('Current video:', videos[currentVideoIndex]?.id);
      console.log('Next video:', videos[newIndex]?.id);
      console.log('Player available:', !!player);
      
      setCurrentVideoIndex(newIndex);
      
      // For auto-advance, always recreate the player to ensure clean state
      console.log('Auto-advance: recreating player for clean transition');
      setIsPlaying(true);
      setCurrentKey(prev => prev + 1);
    }, 1000); // Reduced delay for faster transition
  };

  const nextVideo = () => {
    const newIndex = (currentVideoIndex + 1) % videos.length;
    console.log('Next video - current:', currentVideoIndex, 'new:', newIndex);
    setCurrentVideoIndex(newIndex);
    setShowNextButton(false);
    
    if (player && videos[newIndex]) {
      console.log('Manual next - Loading video:', videos[newIndex].id);
      player.loadVideoById(videos[newIndex].id);
      setIsPlaying(false);
    } else {
      setIsPlaying(false);
      setCurrentKey(prev => prev + 1);
    }
  };
  
  const prevVideo = () => {
    const newIndex = (currentVideoIndex - 1 + videos.length) % videos.length;
    console.log('Previous video - current:', currentVideoIndex, 'new:', newIndex);
    setCurrentVideoIndex(newIndex);
    setShowNextButton(false);
    
    if (player && videos[newIndex]) {
      console.log('Manual prev - Loading video:', videos[newIndex].id);
      player.loadVideoById(videos[newIndex].id);
      setIsPlaying(false);
    } else {
      setIsPlaying(false);
      setCurrentKey(prev => prev + 1);
    }
  };
  
  const selectVideo = (index: number) => {
    console.log('Selecting video index:', index, 'video ID:', videos[index]?.id);
    setCurrentVideoIndex(index);
    setShowNextButton(false);
    
    if (player && videos[index]) {
      console.log('Manual select - Loading video:', videos[index].id);
      player.loadVideoById(videos[index].id);
      setIsPlaying(false);
    } else {
      setIsPlaying(false);
      setCurrentKey(prev => prev + 1);
    }
  };

  const togglePlay = () => {
    if (player) {
      if (isPlaying) {
        player.pauseVideo();
        setIsPlaying(false);
      } else {
        player.playVideo();
        setIsPlaying(true);
        setShowNextButton(false); // Hide overlay when starting to play
      }
    } else {
      // Fallback for when player isn't ready
      setIsPlaying(!isPlaying);
      setShowNextButton(false);
      setCurrentKey(prev => prev + 1);
    }
  };
  
  // Handle share functionality
  const handleShare = async () => {
    const url = `https://www.youtube.com/watch?v=${currentVideo.id}`;
    const title = currentVideoData?.title || 'Check out this music!';
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Listen to "${title}" by Grant Matai Cross`,
          url: url,
        });
        setShareMessage('🔗 Shared!');
      } catch (err) {
        // User cancelled or share failed
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
    setTimeout(() => setShareMessage(''), 2000);
  };
  
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShareMessage('📋 Link copied!');
    } catch (err) {
      setShareMessage('❌ Copy failed');
    }
  };
  
  if (loading) {
    return (
      <div className="rounded-3xl p-8 shadow-forest flex items-center justify-center h-96" style={{backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)'}}>
        <div className="text-white text-lg">Loading videos...</div>
      </div>
    );
  }
  
  return (
    <div className="rounded-3xl p-8 shadow-forest" style={{backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)'}}>
      {/* Main Video Player */}
      <div className="aspect-video rounded-2xl overflow-hidden mb-6 relative">
        <div
          id={`youtube-player-${currentKey}`}
          className="w-full h-full rounded-2xl"
        ></div>
        
        {/* Custom End Screen Overlay */}
        {showNextButton && videos.length > 1 && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded-2xl">
            <div className="text-center">
              <h3 className="text-white text-xl mb-4">Video Finished!</h3>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowNextButton(false);
                    const newIndex = (currentVideoIndex + 1) % videos.length;
                    setCurrentVideoIndex(newIndex);
                    
                    if (player && videos[newIndex]) {
                      console.log('Overlay next - Loading video:', videos[newIndex].id);
                      player.loadVideoById(videos[newIndex].id);
                      player.playVideo();
                      setIsPlaying(true);
                    } else {
                      setIsPlaying(true);
                      setCurrentKey(prev => prev + 1);
                    }
                  }}
                  className="px-6 py-3 rounded-lg text-white font-semibold hover:scale-105 transition-transform"
                  style={{backgroundColor: '#BC6A1B'}}
                >
                  Next Video ({((currentVideoIndex + 1) % videos.length) + 1}/{videos.length})
                </button>
                <button
                  onClick={() => setShowNextButton(false)}
                  className="px-6 py-3 rounded-lg text-white font-semibold hover:scale-105 transition-transform border-2"
                  style={{borderColor: '#BC6A1B'}}
                >
                  Stay Here
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Player Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2">
            {currentVideoData?.title || 'Loading...'}
          </h3>
          <p className="text-white text-opacity-70 text-sm">
            By {currentVideoData?.author_name || 'Grant Matai Cross'}
          </p>
        </div>
        
        <div className="flex items-center space-x-4 ml-8">
          <button
            onClick={prevVideo}
            className="p-3 rounded-full hover:scale-110 transition-transform"
            style={{backgroundColor: '#BC6A1B'}}
          >
            <BackwardIcon className="w-6 h-6 text-white" />
          </button>
          
          <button
            onClick={togglePlay}
            className="p-4 rounded-full hover:scale-110 transition-transform"
            style={{backgroundColor: '#602718'}}
          >
            {isPlaying ? (
              <div className="w-8 h-8 flex items-center justify-center">
                <div className="w-2 h-6 bg-white rounded mr-1"></div>
                <div className="w-2 h-6 bg-white rounded"></div>
              </div>
            ) : (
              <PlayIcon className="w-8 h-8 text-white ml-1" />
            )}
          </button>
          
          <button
            onClick={nextVideo}
            className="p-3 rounded-full hover:scale-110 transition-transform"
            style={{backgroundColor: '#BC6A1B'}}
          >
            <ForwardIcon className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
      
      {/* Auto-advance Toggle */}
      <div className="flex items-center justify-start mb-6">
        <label className="flex items-center space-x-3 text-white text-sm">
          <input
            type="checkbox"
            checked={autoAdvance}
            onChange={(e) => setAutoAdvance(e.target.checked)}
            className="w-4 h-4 rounded border-white border-opacity-30 bg-transparent checked:bg-orange-500 focus:ring-2 focus:ring-orange-400 focus:ring-offset-0"
          />
          <span className="text-white text-opacity-80">Auto-advance to next video</span>
        </label>
      </div>
      
      {/* Video Info */}
      <div className="flex items-center justify-between text-sm text-white text-opacity-60 mb-6">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <MusicalNoteIcon className="w-4 h-4 mr-1" />
            Acoustic Guitar Performance
          </span>
          {shareMessage && (
            <span className="text-white bg-black bg-opacity-50 px-3 py-1 rounded-full text-xs">
              {shareMessage}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleShare}
            className="p-2 hover:text-white transition-colors rounded-full hover:bg-white hover:bg-opacity-10"
            title="Share this video"
          >
            <ShareIcon className="w-5 h-5" />
          </button>
          <Link
            href={`https://www.youtube.com/watch?v=${currentVideo.id}`}
            target="_blank"
            className="p-2 hover:text-white transition-colors rounded-full hover:bg-white hover:bg-opacity-10"
            title="Open on YouTube"
          >
            <ArrowTopRightOnSquareIcon className="w-5 h-5" />
          </Link>
        </div>
      </div>
      
      {/* Playlist */}
      <div className="border-t border-white border-opacity-20 pt-6">
        <h4 className="text-lg font-semibold text-white mb-4">Playlist ({videos.length} videos)</h4>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {videos.map((video, index) => {
            const data = videoData[index];
            return (
              <button
                key={video.id}
                onClick={() => selectVideo(index)}
                className={`w-full flex items-center space-x-4 p-3 rounded-xl transition-all hover:bg-white hover:bg-opacity-10 ${
                  index === currentVideoIndex ? 'ring-2 ring-orange-400 bg-orange-900 bg-opacity-30' : ''
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                    alt={data?.title || 'Video'}
                    className="w-20 h-12 object-cover rounded-lg"
                  />
                  {index === currentVideoIndex && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{backgroundColor: '#BC6A1B'}}>
                        <PlayIcon className="w-3 h-3 text-white ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className={`font-medium text-sm line-clamp-1 ${
                    index === currentVideoIndex ? 'text-white' : 'text-white'
                  }`}>
                    {data?.title || 'Loading...'}
                  </p>
                  <p className={`text-xs ${
                    index === currentVideoIndex ? 'text-white text-opacity-80' : 'text-white text-opacity-60'
                  }`}>
                    {data?.author_name || 'Grant Matai Cross'}
                  </p>
                </div>
                <div className="text-xs text-white text-opacity-60">
                  {index + 1}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default function MusicPage() {
  const [allVideos, setAllVideos] = useState<Video[]>(defaultVideos);

  useEffect(() => {
    // Debug function - only available in browser
    if (typeof window !== 'undefined') {
      (window as any).debugMusicPage = () => {
        console.log('=== Music Page Debug Info ===');
        console.log('Current videos:', allVideos);
        console.log('localStorage musicVideos:', localStorage.getItem('musicVideos'));
        console.log('Default videos:', defaultVideos);
        
        // Clear cache and reload
        localStorage.removeItem('musicVideos');
        console.log('Cleared localStorage cache');
        window.location.reload();
      };
    }
  }, [allVideos]);

  useEffect(() => {
    // Load videos from admin panel (localStorage) or use defaults
    const savedVideos = localStorage.getItem('musicVideos');
    if (savedVideos !== null) {
      // localStorage exists (could be empty array or have videos)
      try {
        const adminVideos = JSON.parse(savedVideos);
        // Validate that adminVideos is an array
        if (Array.isArray(adminVideos)) {
          if (adminVideos.length > 0) {
            // Convert admin video format to player format and filter out invalid entries
            const playerVideos = adminVideos
              .map((video: any) => ({ id: video.id }))
              .filter(video => video.id && typeof video.id === 'string');
            
            if (playerVideos.length > 0) {
              setAllVideos(playerVideos);
            } else {
              // Admin videos exist but are invalid, clear them and show empty
              localStorage.setItem('musicVideos', JSON.stringify([]));
              setAllVideos([]);
            }
          } else {
            // Admin has explicitly cleared all videos (empty array)
            setAllVideos([]);
          }
        } else {
          console.log('Invalid video data format in localStorage, clearing and using defaults');
          // Invalid format, reset to defaults
          setAllVideos(defaultVideos);
          const defaultAdminVideos = defaultVideos.map(video => ({
            id: video.id,
            title: `Default Video ${video.id}`,
            author: 'Grant Matai Cross',
            thumbnail: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`,
            addedDate: new Date().toISOString()
          }));
          localStorage.setItem('musicVideos', JSON.stringify(defaultAdminVideos));
        }
      } catch (error) {
        console.error('Error loading admin videos:', error);
        // Clear corrupt localStorage data and use defaults
        localStorage.removeItem('musicVideos');
        setAllVideos(defaultVideos);
        const defaultAdminVideos = defaultVideos.map(video => ({
          id: video.id,
          title: `Default Video ${video.id}`,
          author: 'Grant Matai Cross',
          thumbnail: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`,
          addedDate: new Date().toISOString()
        }));
        localStorage.setItem('musicVideos', JSON.stringify(defaultAdminVideos));
      }
    } else {
      // No localStorage data at all (first visit) - use defaults and save them
      console.log('No videos in localStorage, using defaults and saving them');
      setAllVideos(defaultVideos);
      const defaultAdminVideos = defaultVideos.map(video => ({
        id: video.id,
        title: `Default Video ${video.id}`,
        author: 'Grant Matai Cross',
        thumbnail: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`,
        addedDate: new Date().toISOString()
      }));
      localStorage.setItem('musicVideos', JSON.stringify(defaultAdminVideos));
    }
  }, []);
  return (
    <div className="min-h-screen" style={{backgroundColor: '#87AA6A'}}>
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 sm:py-32" style={{backgroundColor: '#87AA6A'}}>
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-1/4 w-2 h-2 rounded-full" style={{backgroundColor: 'rgba(188, 106, 27, 0.3)'}}></div>
          <div className="absolute top-32 right-1/3 w-1 h-1 rounded-full" style={{backgroundColor: 'rgba(83, 89, 37, 0.2)'}}></div>
          <div className="absolute bottom-40 left-1/5 w-1.5 h-1.5 rounded-full" style={{backgroundColor: 'rgba(188, 106, 27, 0.25)'}}></div>
        </div>
        
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            {/* Musical decorations */}
            <div className="absolute top-0 left-1/4 text-4xl" style={{color: 'rgba(188, 106, 27, 0.2)'}}>♪</div>
            <div className="absolute top-10 right-1/4 text-3xl" style={{color: 'rgba(96, 39, 24, 0.2)'}}>♫</div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl font-bold tracking-tight text-white sm:text-6xl font-serif"
            >
              My Music &{' '}
              <span className="relative" style={{color: '#602718'}}>
                Performances
                <div className="absolute -bottom-2 left-0 right-0 h-1 rounded-full opacity-30" style={{backgroundColor: '#BC6A1B'}}></div>
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-6 text-lg leading-8 text-white"
            >
              Explore my collection of acoustic guitar performances, original compositions, 
              and educational content. From technical studies to beautiful melodies, 
              discover the artistry of acoustic guitar.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-10 flex items-center justify-center gap-x-6"
            >
              <Link
                href="https://www.youtube.com/@grantmataicross8825/featured"
                target="_blank"
                className="group px-8 py-4 text-sm font-semibold text-white shadow-warm hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg transition-all hover-lift relative overflow-hidden"
                style={{backgroundColor: '#602718'}}
              >
                <span className="relative z-10 flex items-center">
                  <MusicalNoteIcon className="w-5 h-5 mr-2" />
                  Subscribe on YouTube
                </span>
              </Link>
              <Link
                href="/portal"
                className="group flex items-center text-sm font-semibold leading-6 text-white transition-colors border-2 px-6 py-3 rounded-lg hover-lift"
                style={{borderColor: '#602718'}}
              >
                <span>Learn with Me</span>
                <ArrowTopRightOnSquareIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Built-in Music Player */}
      <section className="py-24 sm:py-32" style={{backgroundColor: '#66732C'}}>
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl font-serif">
              Music Player
            </h2>
            <p className="mt-6 text-lg leading-8 text-white">
              Listen to my performances directly on the website. Use the controls to navigate 
              through my collection of acoustic guitar music.
            </p>
          </div>
          
          {allVideos.length > 0 ? (
            <MusicPlayer videos={allVideos} />
          ) : (
            <div className="text-center py-16">
              <div className="mx-auto max-w-lg">
                <MusicalNoteIcon className="mx-auto h-16 w-16 text-white opacity-60" />
                <h3 className="mt-6 text-xl font-semibold text-white">No Music Videos Available</h3>
                <p className="mt-2 text-white opacity-80">
                  Check back soon for new acoustic guitar performances, or visit my YouTube channel for more content.
                </p>
                <div className="mt-8">
                  <a
                    href="https://www.youtube.com/@grantmatai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 rounded-lg font-medium text-white transition-all hover-lift"
                    style={{backgroundColor: '#BC6A1B'}}
                  >
                    <ArrowTopRightOnSquareIcon className="h-5 w-5 mr-2" />
                    Visit YouTube Channel
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-24 sm:py-32" style={{backgroundColor: '#535925'}}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl font-serif">
              More Ways to Listen
            </h2>
            <p className="mt-6 text-lg leading-8 text-white">
              Explore my full collection on YouTube or book a lesson to learn these techniques yourself.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="rounded-2xl p-8 text-center hover-lift"
              style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}
            >
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{backgroundColor: '#BC6A1B'}}>
                <MusicalNoteIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">YouTube Channel</h3>
              <p className="text-white text-opacity-80 mb-6">
                Subscribe to my channel for the latest uploads, full-length videos, and community updates.
              </p>
              <Link
                href="https://www.youtube.com/@grantmataicross8825/featured"
                target="_blank"
                className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white rounded-lg transition-all hover-lift"
                style={{backgroundColor: '#602718'}}
              >
                Visit Channel
                <ArrowTopRightOnSquareIcon className="ml-2 h-4 w-4" />
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="rounded-2xl p-8 text-center hover-lift"
              style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}
            >
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{backgroundColor: '#BC6A1B'}}>
                <SpeakerWaveIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Learn to Play</h3>
              <p className="text-white text-opacity-80 mb-6">
                Want to learn these techniques? Book a lesson and I&apos;ll teach you how to play these pieces.
              </p>
              <Link
                href="/portal"
                className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white rounded-lg transition-all hover-lift"
                style={{backgroundColor: '#602718'}}
              >
                Book Lesson
                <ArrowTopRightOnSquareIcon className="ml-2 h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Blog & Updates */}
      <section className="py-16 sm:py-24 relative overflow-hidden" style={{backgroundColor: '#602718'}}>
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-10 left-1/4 text-6xl text-white">📝</div>
            <div className="absolute top-20 right-1/4 text-4xl text-white">✍️</div>
            <div className="absolute bottom-10 left-1/3 text-5xl text-white">📖</div>
            <div className="absolute bottom-20 right-1/3 text-3xl text-white">💭</div>
          </div>
        </div>
        
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-3xl font-bold tracking-tight text-white sm:text-4xl font-serif"
            >
              Latest from the Blog
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white"
            >
              Read about my musical journey, guitar techniques, performance insights, 
              and teaching philosophy. Stay updated with my latest thoughts on music and education.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="mt-10 flex items-center justify-center gap-x-6"
            >
              <Link
                href="/blog"
                className="px-8 py-4 text-sm font-semibold shadow-warm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg transition-all hover-lift text-white"
                style={{backgroundColor: '#BC6A1B'}}
              >
                Read My Blog
              </Link>
              <Link
                href="/contact"
                className="group text-sm font-semibold leading-6 text-white transition-colors flex items-center border-2 px-6 py-3 rounded-lg hover-lift"
                style={{borderColor: 'rgba(255,255,255,0.3)'}}
              >
                Share Your Thoughts <ArrowTopRightOnSquareIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
