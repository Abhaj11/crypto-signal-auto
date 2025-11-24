'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handler = (error: FirestorePermissionError) => {
      console.error(error); // Log the full contextual error to the console for debugging.
      
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: 'You do not have permission to perform this action. Check the console for details.',
        duration: 9000,
      });

      // In a production environment, you might want to throw the error
      // to an error boundary or a logging service like Sentry.
      if (process.env.NODE_ENV === 'development') {
         // During development, we want the Next.js error overlay to appear
         // with the rich contextual error. We throw it asynchronously to
         // prevent React from catching it in its own try-catch block.
         setTimeout(() => {
            throw error;
         });
      }
    };

    errorEmitter.on('permission-error', handler);

    return () => {
      errorEmitter.off('permission-error', handler);
    };
  }, [toast]);

  return null; // This component does not render anything.
}
