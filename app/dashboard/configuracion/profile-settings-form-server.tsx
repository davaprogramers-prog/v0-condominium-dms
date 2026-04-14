import { ProfileSettingsForm } from "./profile-settings-form"

interface ProfileSettingsFormServerProps {
  profile: any
  userEmail?: string
  cardBgColor?: string
  cardTextColor?: string
}

export function ProfileSettingsFormServer({ profile, userEmail, cardBgColor = "#1e293b", cardTextColor = "#f1f5f9" }: ProfileSettingsFormServerProps) {
  return (
    <ProfileSettingsForm 
      profile={profile}
      userEmail={userEmail}
      cardBgColor={cardBgColor}
      cardTextColor={cardTextColor}
    />
  )
}
