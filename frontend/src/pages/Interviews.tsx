import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Interview } from '@/types';

export function Interviews() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInterviews() {
      if (!user) return;

      const query = supabase
        .from('interviews')
        .select('*')
        .or(`interviewer_id.eq.${user.id},candidate_id.eq.${user.id}`)
        .order('scheduled_at', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching interviews:', error);
        return;
      }

      setInterviews(data as Interview[]);
      setLoading(false);
    }

    fetchInterviews();
  }, [user]);

  if (loading) {
    return (
      <div className="py-10">
        <div className="text-center">Loading interviews...</div>
      </div>
    );
  }

  return (
    <div className="py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Upcoming Interviews</h1>
        {user?.role === 'interviewer' && (
          <Link to="/create">
            <Button>Create New Interview</Button>
          </Link>
        )}
      </div>

      {interviews.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-600">No interviews found.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {interviews.map((interview) => (
            <div
              key={interview.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{interview.title}</h3>
                  {interview.description && (
                    <p className="mt-1 text-gray-600">{interview.description}</p>
                  )}
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(interview.scheduledAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      {interview.duration} minutes
                    </div>
                  </div>
                </div>
                <Link to={`/interview/${interview.id}`}>
                  <Button variant="ghost" className="flex items-center">
                    Join <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}