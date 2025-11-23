export const notificationTemplates = [
  {
    id: 'feature_launch',
    label: 'New Feature Launch',
    title: 'New feature: Enhanced Matching',
    body: "We just shipped a better matching experience — check it out!",
    data: { screen: 'home', highlight: 'matching' }
  },
  {
    id: 'promo_weekend',
    label: 'Weekend Promo',
    title: 'Weekend Special: Get 50% more Roses',
    body: 'Top up this weekend and get 50% extra roses — limited time!',
    data: { screen: 'store', promo: 'weekend50' }
  },
  {
    id: 'maintenance_alert',
    label: 'Scheduled Maintenance',
    title: 'Planned maintenance',
    body: 'We will be performing brief maintenance at 02:00 UTC. Some features may be unavailable.',
    data: { type: 'maintenance' }
  },
  {
    id: 'safety_tip',
    label: 'Safety Tip',
    title: 'Stay safe on dates',
    body: 'Meet in public places and let friends know where you are. Read our safety tips in the app.',
    data: { screen: 'safety' }
  }
]
