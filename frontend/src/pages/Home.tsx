import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, Code, Calendar, MessageSquare } from 'lucide-react';

export function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Conduct Technical Interviews with Confidence
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          A powerful platform for conducting real-time technical interviews with integrated code editor,
          whiteboarding tools, and collaborative features.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link to="/create">
            <Button size="lg">Create Interview</Button>
          </Link>
          <Link to="/interviews">
            <Button variant="outline" size="lg">
              View Interviews
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-32">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <Feature
            icon={<Code className="h-8 w-8" />}
            title="Live Coding"
            description="Real-time collaborative code editor with syntax highlighting and multiple language support."
          />
          <Feature
            icon={<Calendar className="h-8 w-8" />}
            title="Easy Scheduling"
            description="Schedule and manage interviews with automated reminders and calendar integration."
          />
          <Feature
            icon={<MessageSquare className="h-8 w-8" />}
            title="Live Chat"
            description="Built-in chat functionality for seamless communication during interviews."
          />
          <Feature
            icon={<Users className="h-8 w-8" />}
            title="Team Collaboration"
            description="Invite team members, share feedback, and collaborate on interviews."
          />
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="relative rounded-2xl border border-gray-200 p-8">
      <div className="absolute -top-4 left-4 inline-block rounded-xl bg-blue-600 p-2 text-white shadow-lg">
        {icon}
      </div>
      <h3 className="mt-4 text-xl font-semibold text-gray-900">{title}</h3>
      <p className="mt-4 text-gray-600">{description}</p>
    </div>
  );
}