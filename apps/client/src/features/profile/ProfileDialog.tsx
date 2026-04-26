import { Avatar } from '@/components/ui/Avatar/Avatar';
import { useAuth } from '@/context/AuthContext';
import { getUserDisplayName, getUserInitial } from '@/utils/user';
import * as Dialog from '@radix-ui/react-dialog';
import { LogOut, User as UserIcon, X } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfileDialog.css';

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileDialog: React.FC<ProfileDialogProps> = ({ open, onOpenChange }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    onOpenChange(false);
  };

  const handleProfileClick = () => {
    if (user) {
      navigate('/profile');
      onOpenChange(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className='dialog-overlay' />
        <Dialog.Content className='dialog-content profile-dialog-content'>

          <div className='dialog-header'>
            <button aria-label='סגור' className='dialog-close' onClick={() => onOpenChange(false)}>
              <X size={16} />
            </button>
            <span className='dialog-title'>פרופיל אישי</span>
            <div style={{ width: 32 }}></div>
          </div>

          <div className='dialog-body'>
            <div className='profile-header'>
              <Avatar
                src={user.picture}
                fallback={getUserInitial(user)}
                size="large"
              />
              <div className='profile-info'>
                <h2>{getUserDisplayName(user)}</h2>
                <p>{user.email}</p>
              </div>
            </div>

            <hr className='profile-divider' />

            <div className='profile-actions'>
              <button className='profile-action-button' onClick={handleProfileClick}>
                <UserIcon size={18} />
                <span>הצג פרופיל</span>
              </button>
              <button className='profile-action-button logout' onClick={handleLogout}>
                <LogOut size={18} />
                <span>התנתקות</span>
              </button>
            </div>

          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};