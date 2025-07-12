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

interface WelcomeEmailProps {
  email: string
  confirmUrl: string
}

export const WelcomeEmail = ({
  email,
  confirmUrl,
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to ScamShield – Confirm your account</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <div style={logo}>🛡️</div>
          <Heading style={h1}>Welcome to ScamShield</Heading>
        </Section>
        
        <Text style={text}>
          Hi there,
        </Text>
        
        <Text style={text}>
          Welcome to ScamShield, where your investment security comes first. We're excited to help you protect your financial future with our advanced AI-powered scam detection.
        </Text>
        
        <Section style={buttonSection}>
          <Link href={confirmUrl} style={button}>
            Confirm Your Account
          </Link>
        </Section>
        
        <Text style={text}>
          Once confirmed, you'll have access to:
        </Text>
        
        <ul style={list}>
          <li style={listItem}>Advanced scam detection algorithms</li>
          <li style={listItem}>Real-time investment risk analysis</li>
          <li style={listItem}>Comprehensive protection reports</li>
          <li style={listItem}>Priority customer support</li>
        </ul>
        
        <Text style={text}>
          If you didn't create this account, you can safely ignore this email.
        </Text>
        
        <Hr style={hr} />
        
        <Text style={footer}>
          ScamShield – Protecting investments with intelligence and precision.
          <br />
          Built for those who value security and trust in their financial decisions.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default WelcomeEmail

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