import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const AdminPage = () => {
  const { toast } = useToast();

  React.useEffect(() => {
    toast({
      title: "🚧 Admin Panel Coming Soon!",
      description: "This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  }, [toast]);

  return (
    <>
      <Helmet>
        <title>Admin Panel - HeySpender</title>
        <meta name="description" content="Manage your wishlists and contributions from the admin panel." />
      </Helmet>

      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">
            Admin Panel
          </h1>
          <p className="text-lg text-gray-600">
            This is a protected route. Authentication and admin features will be implemented soon!
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default AdminPage;