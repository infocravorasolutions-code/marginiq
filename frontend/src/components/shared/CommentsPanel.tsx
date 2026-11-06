import { useState, useEffect } from 'react';
import { Send, User } from 'lucide-react';
import { api } from '../../lib/api';

interface CommentsPanelProps {
  entityType: string;
  entityId: string;
}

export function CommentsPanel({ entityType, entityId }: CommentsPanelProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [entityType, entityId]);

  const fetchComments = async () => {
    try {
      const { data } = await api.get(`/comments/${entityType}/${entityId}`);
      setComments(data || []);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!newComment.trim()) return;
    try {
      const { data } = await api.post('/comments', {
        entityType,
        entityId,
        body: newComment
      });
      setComments([...comments, data]);
      setNewComment('');
    } catch (err) {
      alert('Failed to post comment');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete comment?')) return;
    try {
      await api.delete(`/comments/${id}`);
      setComments(comments.filter(c => c._id !== id));
    } catch (err) {
      alert('Failed to delete comment');
    }
  };

  if (loading) return <div className="p-4 text-sm text-slate-500">Loading comments...</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.map((comment) => (
          <div key={comment._id} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex-1">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-900">
                    {comment.userId?.firstName} {comment.userId?.lastName}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.body}</p>
              </div>
              <button 
                onClick={() => handleDelete(comment._id)}
                className="text-xs text-red-500 mt-1 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-slate-500 text-center">No comments yet. Start the conversation!</p>
        )}
      </div>
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Type a comment... (use @ to mention)"
            className="flex-1 resize-none rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            rows={2}
          />
          <button
            onClick={handlePost}
            disabled={!newComment.trim()}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
