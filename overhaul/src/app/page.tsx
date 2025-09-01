'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  MusicalNoteIcon, 
  AcademicCapIcon, 
  PlayIcon,
  ArrowRightIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const features = [
  {
    name: 'Acoustic Guitar Lessons',
    description: 'Learn proper technique and beautiful classical pieces with personalized instruction.',
    icon: AcademicCapIcon,
  },
  {
    name: 'Original Music',
    description: 'Discover my original compositions and covers on YouTube and other platforms.',
    icon: MusicalNoteIcon,
  },
  {
    name: 'Student Resources',
    description: 'Access practice materials, sheet music, and lesson recordings in your private portal.',
    icon: UserGroupIcon,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{backgroundColor: '#87AA6A'}}>
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{backgroundColor: '#87AA6A'}}>
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
            <div className="text-center">
              {/* Musical Note Decorations */}
              <div className="absolute top-20 left-1/4 text-4xl" style={{color: 'rgba(188, 106, 27, 0.2)'}}>♪</div>
              <div className="absolute top-32 right-1/4 text-3xl" style={{color: 'rgba(83, 89, 37, 0.2)'}}>♫</div>
              <div className="absolute bottom-40 left-1/3 text-2xl" style={{color: 'rgba(188, 106, 27, 0.2)'}}>♬</div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-4xl font-bold tracking-tight text-white sm:text-6xl font-serif"
              >
                Welcome to{' '}
                <span className="relative" style={{color: '#602718'}}>
                  Chief&apos;s Music
                  <div className="absolute -bottom-2 left-0 right-0 h-1 rounded-full opacity-30" style={{backgroundColor: '#BC6A1B'}}></div>
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mt-6 text-lg leading-8 text-white"
              >
                Professional guitar instruction and beautiful original music by Matai Cross. 
                Learn classical guitar with personalized lessons or enjoy my latest performances.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-10 flex items-center justify-center gap-x-6"
              >
                <Link
                  href="/contact-us"
                  className="group px-8 py-4 text-sm font-semibold text-white shadow-warm hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg transition-all hover-lift relative overflow-hidden"
                  style={{backgroundColor: '#602718'}}
                >
                  <span className="relative z-10">Book a Lesson</span>
                </Link>
                <Link
                  href="/music"
                  className="group flex items-center text-sm font-semibold leading-6 text-white transition-colors border-2 px-6 py-3 rounded-lg hover-lift"
                  style={{borderColor: '#602718', color: '#602718'}}
                >
                  <span>Watch Performances</span>
                  <PlayIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32 relative" style={{backgroundColor: '#66732C'}}>
        {/* Subtle wood grain texture overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: `linear-gradient(90deg, transparent 0%, rgba(109, 76, 61, 0.1) 50%, transparent 100%)`,
            backgroundSize: '200px 100%'
          }}></div>
        </div>
        
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl font-serif">
              What I Offer
            </h2>
            <p className="mt-6 text-lg leading-8 text-white">
              Whether you&apos;re a beginner or looking to refine your technique, I provide personalized 
              guitar instruction and share my passion for music through original compositions.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex flex-col group hover-lift"
                >
                  <div className="glass-effect rounded-2xl p-8 shadow-soft hover:shadow-warm" style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}>
                    <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white mb-4">
                      <div className="p-3 rounded-xl group-hover:scale-110 transition-transform" style={{backgroundColor: '#BC6A1B'}}>
                        <feature.icon className="h-6 w-6 flex-none text-white" aria-hidden="true" />
                      </div>
                      {feature.name}
                    </dt>
                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-white">
                      <p className="flex-auto">{feature.description}</p>
                    </dd>
                  </div>
                </motion.div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 sm:py-32 relative overflow-hidden" style={{backgroundColor: '#535925'}}>
        
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
            <div className="max-w-xl">
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-3xl font-bold tracking-tight text-white sm:text-4xl font-serif"
              >
                About Chief (Matai Cross)
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="mt-6 text-lg leading-8 text-white"
              >
                I&apos;ve been playing guitar since I was 8 years old and have written 25 original songs 
                with both chords and lyrics. I specialize in acoustic guitar, mastering both fingerstyle 
                and strumming techniques while incorporating vocals into my performances.
              </motion.p>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="mt-6 text-lg leading-8 text-white"
              >
                After serving an LDS mission in Washington, D.C., I&apos;ve grown passionate in sharing the beauty 
                of guitar music through teaching and performance. My goal is to help students discover 
                their own musical voice while building proper technique and musical understanding.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="mt-8"
              >
                <Link
                  href="/blog"
                  className="inline-flex items-center font-semibold transition-colors px-6 py-3 rounded-lg shadow-soft hover-lift text-white"
                  style={{backgroundColor: '#BC6A1B'}}
                >
                  Follow my musical journey <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="aspect-[3/4] overflow-hidden rounded-2xl shadow-green relative"
            >
              <img
                src="/chief-photo.jpg"
                alt="Chief (Matai Cross) with his acoustic guitar"
                className="h-full w-full object-contain"
                style={{backgroundColor: '#535925'}}
              />
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
