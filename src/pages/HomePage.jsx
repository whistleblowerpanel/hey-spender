import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Gift, Share2, Heart, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
const FeatureCard = ({
  feature,
  index
}) => {
  const colors = [{
    bg: 'bg-brand-beige',
    lightBg: 'bg-[#FDF5E9]'
  }, {
    bg: 'bg-brand-pink-light',
    lightBg: 'bg-[#FFF0FF]'
  }, {
    bg: 'bg-brand-salmon',
    lightBg: 'bg-[#FBEAE3]'
  }, {
    bg: 'bg-brand-green',
    lightBg: 'bg-[#E9FBEA]'
  }];
  const {
    bg,
    lightBg
  } = colors[index % colors.length];
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} whileInView={{
    opacity: 1,
    y: 0
  }} viewport={{
    once: true
  }} transition={{
    duration: 0.5,
    delay: index * 0.1
  }} className="[perspective:1000px] group">
      <div className={`relative w-full h-64 border border-black transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] ${bg}`}>
        {/* Front of card */}
        <div className="absolute w-full h-full [backface-visibility:hidden] p-6 flex flex-col justify-between border border-black">
          <h3 className="text-2xl font-bold text-black leading-tight">
            {feature.title.split(' ').map((word, i) => <span key={i} className="block">{word}</span>)}
          </h3>
          <div className="self-end">
            <feature.icon className="w-20 h-20 text-black" />
          </div>
        </div>
        {/* Back of card */}
        <div className={`absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] text-black p-6 flex flex-col items-center justify-center text-center border border-black ${lightBg}`}>
          <h3 className="text-xl font-bold mb-2">
            {feature.title.split(' ').join(' ')}
          </h3>
          <p className="mb-4">{feature.description}</p>
          <feature.icon className="w-12 h-12" />
        </div>
      </div>
    </motion.div>;
};
const HomePage = () => {
  const navigate = useNavigate();
  const handleGetStarted = () => {
    navigate('/register');
  };
  const features = [{
    icon: Gift,
    title: "Create Wishlists",
    description: "Build beautiful wishlists for any occasion - birthdays, weddings, or just because!"
  }, {
    icon: Share2,
    title: "Easy Sharing",
    description: "Share your wishlist via link, QR code, or social media with just one click"
  }, {
    icon: Heart,
    title: "Accept Contributions",
    description: "Receive contributions via Paystack, Flutterwave, or Monnify seamlessly"
  }, {
    icon: Sparkles,
    title: "Track Progress",
    description: "Monitor contributions in real-time and send thank you messages automatically"
  }];
  return <>
      <Helmet>
        <title>HeySpender - Create & Share Your Wishlist</title>
        <meta name="description" content="Create beautiful wishlists and share them with friends and family. Accept contributions via multiple payment methods." />
      </Helmet>

      <div className="relative overflow-hidden bg-white">
        
        <section className="relative md:min-h-[90vh] flex items-center pt-40 pb-28 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-0 left-0 w-72 h-72 bg-brand-purple-dark/30 mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-20 right-0 w-72 h-72 bg-brand-accent-red/30 mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          </div>
          <div className="max-w-7xl mx-auto relative">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6
          }} className="text-center space-y-8">
              <div className="inline-block">
                <Gift className="w-20 h-20 text-brand-purple-dark mx-auto" />
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold">
                <span className="text-brand-purple-dark">Create Wishlists</span>
                <br />
                <span className="text-gray-800">That Actually Work</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">Share your dreams, accept contributions, and make your wishes come true. The easiest way to create wishlists for your Spenders.</p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button onClick={handleGetStarted} size="lg" variant="custom" className="bg-brand-orange text-black">
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button onClick={() => navigate('/dashboard')} size="lg" variant="custom" className="bg-brand-green text-black">
                  <span>View Demo</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-brand-beige">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.6
          }} className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-brand-purple-dark mb-4">
                Everything You Need
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Powerful features to make wishlist creation and management a breeze
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature, index) => <FeatureCard key={index} feature={feature} index={index} />)}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <motion.div initial={{
          opacity: 0,
          scale: 0.95
        }} whileInView={{
          opacity: 1,
          scale: 1
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }} className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-purple-dark mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Create your first wishlist in less than 2 minutes. No credit card required.
            </p>
            <Button onClick={handleGetStarted} size="lg" variant="custom" className="bg-brand-orange text-black">
              <span>Create Your Wishlist Now</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </section>
      </div>
    </>;
};
export default HomePage;