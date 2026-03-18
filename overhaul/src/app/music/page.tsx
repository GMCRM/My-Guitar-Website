'use client';

import { useState, useEffect, useRef } from 'react';
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

interface VideoData {
  title: string;
  author_name: string;
  thumbnail_url: string;
}

interface Video {
  id: string;
}

interface AudioTrack {
  id: number;
  title: string;
  url: string;
}

const AudioPlaylistPlayer = ({ tracks }: { tracks: AudioTrack[] }) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = tracks[currentTrackIndex];

  const playCurrentTrack = async () => {
    if (!audioRef.current) return;

    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing audio track:', error);
      setIsPlaying(false);
    }
  };

  const pauseCurrentTrack = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const nextTrack = () => {
    if (tracks.length === 0) return;
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
  };

  const prevTrack = () => {
    if (tracks.length === 0) return;
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseCurrentTrack();
    } else {
      playCurrentTrack();
    }
  };

  useEffect(() => {
    if (!audioRef.current) return;

    audioRef.current.load();
    if (isPlaying) {
      playCurrentTrack();
    }
  }, [currentTrackIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      if (tracks.length <= 1) {
        setIsPlaying(false);
        return;
      }

      const nextIndex = (currentTrackIndex + 1) % tracks.length;
      setCurrentTrackIndex(nextIndex);
    };

    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [currentTrackIndex, tracks.length]);

  return (
    <div className="rounded-3xl p-8 shadow-forest" style={{backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)'}}>
      <div className="mb-6">
        <p className="text-sm uppercase tracking-wider text-white text-opacity-70">Now Playing</p>
        <h3 className="text-2xl font-bold text-white mt-2 font-serif">{currentTrack.title}</h3>
      </div>

      <audio ref={audioRef} preload="metadata" className="hidden">
        <source src={currentTrack.url} />
      </audio>

      <div className="flex items-center justify-center space-x-4 mb-6">
        <button
          onClick={prevTrack}
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
          onClick={nextTrack}
          className="p-3 rounded-full hover:scale-110 transition-transform"
          style={{backgroundColor: '#BC6A1B'}}
        >
          <ForwardIcon className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="border-t border-white border-opacity-20 pt-6">
        <h4 className="text-lg font-semibold text-white mb-4">Audio Tracks ({tracks.length})</h4>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {tracks.map((track, index) => (
            <button
              key={track.id}
              onClick={() => setCurrentTrackIndex(index)}
              className={`w-full text-left p-3 rounded-xl transition-all hover:bg-white hover:bg-opacity-10 ${
                index === currentTrackIndex ? 'ring-2 ring-orange-400 bg-orange-900 bg-opacity-30' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-medium truncate pr-4">{track.title}</span>
                <span className="text-xs text-white text-opacity-70">{index + 1}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

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
    if (typeof window === 'undefined' || loading || !currentVideo?.id) return;

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
  }, [loading, currentVideo?.id, currentKey]);

  const initializePlayer = () => {
    if (!window.YT || !window.YT.Player) {
      console.log('YouTube API not ready yet');
      return;
    }

    const containerId = `youtube-player-${currentKey}`;
    const playerContainer = document.getElementById(containerId);
    if (!playerContainer) {
      console.log('YouTube player container not found yet:', containerId);
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
      const newPlayer = new window.YT.Player(containerId, {
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
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [loadingAudio, setLoadingAudio] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(true);

  useEffect(() => {
    const loadAudioTracks = async () => {
      try {
        const response = await fetch('/api/music/audio', { cache: 'no-store' });
        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(result?.error || 'Failed to load audio tracks');
        }

        const tracks: AudioTrack[] = (result.data || [])
          .map((track: { id: number; title: string; public_url: string }) => ({
            id: track.id,
            title: track.title,
            url: track.public_url
          }))
          .filter((track: AudioTrack) => Number.isFinite(track.id) && Boolean(track.title) && Boolean(track.url));

        setAudioTracks(tracks);
      } catch (error) {
        console.error('Error loading music audio tracks:', error);
        setAudioTracks([]);
      } finally {
        setLoadingAudio(false);
      }
    };

    loadAudioTracks();
  }, []);

  useEffect(() => {
    const loadMusicVideos = async () => {
      try {
        const response = await fetch('/api/music/videos', { cache: 'no-store' });
        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(result?.error || 'Failed to load music videos');
        }

        const playerVideos: Video[] = (result.data || [])
          .map((video: any) => ({ id: video.youtube_id }))
          .filter((video: Video) => video.id && typeof video.id === 'string');

        setAllVideos(playerVideos);
      } catch (error) {
        console.error('Error loading music videos:', error);
        setAllVideos([]);
      } finally {
        setLoadingVideos(false);
      }
    };

    loadMusicVideos();
  }, []);
  return (
    <div className="min-h-screen" style={{backgroundColor: '#87AA6A'}}>
      <Navigation />
      
      {/* Audio Section */}
      <section className="relative overflow-hidden py-24 sm:py-32" style={{backgroundColor: '#87AA6A'}}>
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-1/4 w-2 h-2 rounded-full" style={{backgroundColor: 'rgba(188, 106, 27, 0.3)'}}></div>
          <div className="absolute top-32 right-1/3 w-1 h-1 rounded-full" style={{backgroundColor: 'rgba(83, 89, 37, 0.2)'}}></div>
          <div className="absolute bottom-40 left-1/5 w-1.5 h-1.5 rounded-full" style={{backgroundColor: 'rgba(188, 106, 27, 0.25)'}}></div>
        </div>
        
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            {/* Musical decorations */}
            <div className="absolute top-0 left-1/4 text-4xl" style={{color: 'rgba(188, 106, 27, 0.2)'}}>♪</div>
            <div className="absolute top-10 right-1/4 text-3xl" style={{color: 'rgba(96, 39, 24, 0.2)'}}>♫</div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl font-bold tracking-tight text-white sm:text-6xl font-serif"
            >
              Original Music{' '}
              <span className="relative" style={{color: '#602718'}}>
                Audio Library
                <div className="absolute -bottom-2 left-0 right-0 h-1 rounded-full opacity-30" style={{backgroundColor: '#BC6A1B'}}></div>
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-6 text-lg leading-8 text-white"
            >
              Listen to uploaded studio, AI and live covers & recordings with an on-page audio player.
              Use play, pause, and next/previous controls to move through the collection.
            </motion.p>
          </div>

          {loadingAudio ? (
            <div className="mx-auto max-w-6xl text-center py-16 text-white">Loading audio tracks...</div>
          ) : audioTracks.length > 0 ? (
            <div className="mx-auto max-w-6xl">
              <AudioPlaylistPlayer tracks={audioTracks} />
            </div>
          ) : (
            <div className="mx-auto max-w-3xl text-center py-12 rounded-3xl" style={{backgroundColor: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(14px)'}}>
              <MusicalNoteIcon className="mx-auto h-14 w-14 text-white opacity-70" />
              <h3 className="mt-4 text-xl font-semibold text-white">No Audio Tracks Available</h3>
              <p className="mt-2 text-white text-opacity-80">
                New recordings will appear here once uploaded from the admin portal.
              </p>
            </div>
          )}
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
          
          {loadingVideos ? (
            <div className="text-center py-16 text-white">Loading music videos...</div>
          ) : allVideos.length > 0 ? (
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
