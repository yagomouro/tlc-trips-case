'use client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Bot, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TypingIndicatorProps {
  showTimeToFirstByte?: boolean;
}

export function TypingIndicator({
  showTimeToFirstByte = false,
}: TypingIndicatorProps) {
  const [dots, setDots] = useState('');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showTimeToFirstByte) {
      const timer = setInterval(() => {
        setElapsed((prev) => prev + 0.1);
      }, 100);
      return () => clearInterval(timer);
    }
  }, [showTimeToFirstByte]);

  return (
    <div className='flex gap-3 animate-fade-in'>
      <Avatar className='w-8 h-8 shrink-0 bg-muted'>
        <AvatarFallback className='text-foreground'>
          <Bot className='w-4 h-4' />
        </AvatarFallback>
      </Avatar>

      <Card className='p-4 bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-200'>
        <div className='flex items-center gap-2'>
          <div className='flex items-center gap-2'>
            {/* <Wifi className='w-3 h-3 text-[#ea1d2c] animate-pulse' /> */}
            <span className='text-sm text-muted-foreground'>
              {showTimeToFirstByte ? 'Digitando' : 'Digitando'}
              {/* {dots} */}
            </span>
          </div>

          <div className='flex gap-1 ml-2'>
            <div className='w-2 h-2 bg-[#ea1d2c]/60 rounded-full animate-[bounce_1s_infinite] [animation-delay:0s]'></div>
            <div className='w-2 h-2 bg-[#ea1d2c]/60 rounded-full animate-[bounce_1s_infinite] [animation-delay:0.2s]'></div>
            <div className='w-2 h-2 bg-[#ea1d2c]/60 rounded-full animate-[bounce_1s_infinite] [animation-delay:0.4s]'></div>
          </div>

          {showTimeToFirstByte && (
            <span className='text-xs text-muted-foreground/70 ml-2'>
              {elapsed.toFixed(1)}s
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
