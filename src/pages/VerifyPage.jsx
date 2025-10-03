import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { MailCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const VerifyPage = () => {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>Check Your Email - HeySpender</title>
      </Helmet>
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md p-8 space-y-6 bg-white border-2 border-black text-center"
        >
          <MailCheck className="w-16 h-16 mx-auto text-brand-green" />
          <h1 className="text-3xl font-bold text-brand-purple-dark">Check Your Inbox!</h1>
          <p className="text-gray-600">
            We've sent a verification link to your email address. Please click the link to confirm your account.
          </p>
           <p className="text-sm text-gray-500">
            You can close this tab after verifying.
          </p>
          <Button variant="custom" className="bg-brand-salmon text-black" onClick={() => navigate('/login')}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </motion.div>
      </div>
    </>
  );
};

export default VerifyPage;