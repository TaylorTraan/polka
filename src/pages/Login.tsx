import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button, Input, Label, Checkbox, ErrorMessage } from '@/components';
import { motion } from 'framer-motion';
import { Mail, Lock, Circle, ArrowRight, Zap } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app/home');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) navigate('/app/home');
      else {
        setError('Invalid credentials');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Background pushed behind content */}
      <div className="absolute inset-0 -z-10 pointer-events-none bg-gradient-to-br from-background via-background to-muted/10">
        {/* Animated geometric shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <motion.div
            className="absolute top-20 left-20 w-32 h-32 border border-primary/10 rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1], rotate: [0, 180, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-40 right-32 w-24 h-24 border border-secondary/10 rounded-full"
            animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1], rotate: [360, 180, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
          <motion.div
            className="absolute bottom-32 left-32 w-40 h-40 border border-accent/10 rounded-full"
            animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.25, 0.1], rotate: [0, -180, -360] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          />
        </div>

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02] -z-10"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Left Side - Visual Content */}
      <motion.div
        className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative z-10"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        <div className="text-center space-y-8 max-w-md">
          {/* Brand Section */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            className="space-y-6"
          >
            <div className="relative">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shadow-2xl relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-30"></div>
                <Circle className="w-12 h-12 text-primary-foreground drop-shadow-lg" />
              </div>
              <motion.div
                className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center shadow-lg"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Zap className="w-4 h-4 text-accent-foreground" />
              </motion.div>
            </div>

            <div className="space-y-4">
              {/* Solid high-contrast title */}
              <h1 className="text-5xl font-bold text-neutral-900 dark:text-neutral-100 drop-shadow-lg">Polka</h1>
              <p className="text-xl text-neutral-900/90 dark:text-neutral-100/90 leading-relaxed font-semibold drop-shadow-md">
                Never miss a moment in class again
              </p>
            </div>
          </motion.div>

          {/* Feature highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.6 }}
            className="space-y-4 text-left"
          >
            <div className="flex items-center space-x-3 text-neutral-900 dark:text-neutral-100 p-3 rounded-lg hover:bg-white/5 transition-colors group">
              <div className="w-3 h-3 bg-primary rounded-full shadow-lg group-hover:scale-110 transition-transform" />
              <span className="font-semibold">AI-powered note-taking</span>
            </div>
            <div className="flex items-center space-x-3 text-neutral-900 dark:text-neutral-100 p-3 rounded-lg hover:bg-white/5 transition-colors group">
              <div className="w-3 h-3 bg-primary rounded-full shadow-lg group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Context-aware study mode</span>
            </div>
            <div className="flex items-center space-x-3 text-neutral-900 dark:text-neutral-100 p-3 rounded-lg hover:bg-white/5 transition-colors group">
              <div className="w-3 h-3 bg-primary rounded-full shadow-lg group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Offline recording & sync</span>
            </div>
          </motion.div>

          {/* Problem Statement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.9 }}
            className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-3">The Problem</h3>
            <p className="text-sm text-neutral-900/80 dark:text-neutral-100/80 leading-relaxed">
              When you zone out in class, you miss valuable information. There's no way to go back in real-time to hear what was shared. 
              <span className="font-semibold text-primary"> Polka fills this gap.</span>
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <motion.div
        className="flex-1 lg:w-1/2 flex items-center justify-center p-8 lg:p-12 relative z-10"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
      >
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Brand Header */}
          <motion.div
            className="lg:hidden text-center space-y-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <Circle className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Welcome back</h2>
            <p className="text-neutral-700 dark:text-neutral-200 font-semibold">Sign in to your Polka workspace</p>
          </motion.div>

          {/* Login Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <span>Email address</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-background text-neutral-900 dark:text-neutral-100 border border-border focus-visible:ring-2 focus-visible:ring-primary/30 transition-all shadow-sm hover:shadow-md"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-primary" />
                  <span>Password</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-background text-neutral-900 dark:text-neutral-100 border border-border focus-visible:ring-2 focus-visible:ring-primary/30 transition-all shadow-sm hover:shadow-md"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="border-border/50"
                  />
                  <Label htmlFor="remember" className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 cursor-pointer">
                    Remember me
                  </Label>
                </div>
                <button 
                  type="button" 
                  className="text-sm font-medium text-primary hover:text-primary/90 transition-all duration-200 hover:scale-105 px-3 py-1.5 rounded-md hover:bg-primary/5 border border-transparent hover:border-primary/20"
                >
                  Forgot password?
                </button>
              </div>

              {error && (
                <ErrorMessage 
                  message={error}
                  variant="toast"
                  showIcon={true}
                />
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl group relative overflow-hidden"
                disabled={isLoading}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                />
                <span className="relative flex items-center justify-center space-x-2">
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <span>Sign in</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </>
                  )}
                </span>
              </Button>
            </form>

            {/* Demo credentials */}
            <motion.div
              className="pt-6 border-t border-border"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.8 }}
            >
              <div className="text-center space-y-3">
                <p className="text-sm text-neutral-900 dark:text-neutral-100 font-bold">Demo credentials</p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
                  <span className="font-mono bg-primary/10 px-4 py-2 rounded-md text-sm border border-primary/30 text-neutral-900 dark:text-neutral-100 font-medium shadow-md hover:shadow-lg transition-shadow">
                    test@polka.com
                  </span>
                  <span className="text-neutral-900 dark:text-neutral-100 font-bold">/</span>
                  <span className="font-mono bg-primary/10 px-4 py-2 rounded-md text-sm border border-primary/30 text-neutral-900 dark:text-neutral-100 font-medium shadow-md hover:shadow-lg transition-shadow">
                    polka
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
