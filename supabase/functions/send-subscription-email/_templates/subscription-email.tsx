import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface SubscriptionEmailProps {
  email: string
  planType: string
  amount: string
  isNewSubscription: boolean
}

export const SubscriptionEmail = ({
  email,
  planType,
  amount,
  isNewSubscription,
}: SubscriptionEmailProps) => (
  <Html>
    <Head />
    <Preview>
      {isNewSubscription ? 'Welcome to ScamShield Premium' : 'Your ScamShield subscription has been updated'}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <div style={logo}>🛡️</div>
          <Heading style={h1}>
            {isNewSubscription ? 'Welcome to Premium' : 'Subscription Updated'}
          </Heading>
        </Section>
        
        <Text style={text}>
          Hi there,
        </Text>
        
        <Text style={text}>
          {isNewSubscription 
            ? `Thank you for upgrading to ScamShield ${planType}. Your investment protection just got significantly stronger.`
            : `Your ScamShield subscription has been successfully updated to ${planType}.`
          }
        </Text>
        
        <Section style={planSection}>
          <div style={planCard}>
            <Text style={planTitle}>{planType} Plan</Text>
            <Text style={planPrice}>${amount}/month</Text>
            <Text style={planDescription}>
              {planType === 'Premium' 
                ? 'Unlimited scam checks, advanced AI analysis, priority support, API access, and detailed reports.'
                : 'Everything in Premium plus bulk checking, white-label reports, dedicated support, and custom integrations.'
              }
            </Text>
          </div>
        </Section>
        
        <Text style={text}>
          Your enhanced protection features are now active. Here's what you can do:
        </Text>
        
        <ul style={list}>
          <li style={listItem}>Run unlimited investment scam checks</li>
          <li style={listItem}>Access advanced AI risk analysis</li>
          <li style={listItem}>Get priority customer support</li>
          {planType === 'Pro' && (
            <>
              <li style={listItem}>Perform bulk analysis (up to 100 checks)</li>
              <li style={listItem}>Generate white-label reports</li>
              <li style={listItem}>Access custom integrations</li>
            </>
          )}
        </ul>
        
        <Section style={buttonSection}>
          <Link href={`${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com')}/`} style={button}>
            Access Your Dashboard
          </Link>
        </Section>
        
        <Text style={text}>
          Your subscription will automatically renew monthly. You can manage your subscription anytime from your account settings.
        </Text>
        
        <Hr style={hr} />
        
        <Text style={footer}>
          ScamShield – Premium investment protection for the discerning investor.
          <br />
          Questions? Reply to this email and our team will assist you promptly.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SubscriptionEmail

const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
}

const logoSection = {
  textAlign: 'center' as const,
  marginBottom: '40px',
}

const logo = {
  fontSize: '48px',
  marginBottom: '20px',
}

const h1 = {
  color: '#1e293b',
  fontSize: '32px',
  fontWeight: '700',
  lineHeight: '1.2',
  margin: '0',
  textAlign: 'center' as const,
}

const text = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0',
}

const planSection = {
  margin: '32px 0',
  textAlign: 'center' as const,
}

const planCard = {
  backgroundColor: '#ffffff',
  border: '2px solid #3b82f6',
  borderRadius: '12px',
  padding: '32px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
}

const planTitle = {
  color: '#3b82f6',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0 0 12px',
  textAlign: 'center' as const,
}

const planPrice = {
  color: '#1e293b',
  fontSize: '32px',
  fontWeight: '800',
  margin: '0 0 16px',
  textAlign: 'center' as const,
}

const planDescription = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
  textAlign: 'center' as const,
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '1',
  padding: '16px 32px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  background: 'linear-gradient(to right, #3b82f6, #1d4ed8)',
}

const list = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0',
  paddingLeft: '20px',
}

const listItem = {
  margin: '8px 0',
}

const hr = {
  borderColor: '#e2e8f0',
  margin: '32px 0',
}

const footer = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '1.5',
  textAlign: 'center' as const,
  margin: '32px 0 0',
}