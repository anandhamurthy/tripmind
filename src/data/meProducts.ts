export type MEProductKey = 'ADMP' | 'ADSSP' | 'PAM360' | 'ID360' | 'AD360'

export interface ProductFeature {
  id: string
  product: MEProductKey
  category: string
  feature: string
  description: string
  tags: string[]
}

export const ME_PRODUCT_META: Record<MEProductKey, { name: string; full: string; color: string; bg: string }> = {
  ADMP:  { name: 'ADManager Plus',    full: 'ADManager Plus',     color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200'   },
  ADSSP: { name: 'ADSelfService Plus', full: 'ADSelfService Plus', color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200' },
  PAM360:{ name: 'PAM360',            full: 'PAM360',             color: 'text-rose-700',   bg: 'bg-rose-50 border-rose-200'   },
  ID360: { name: 'Identity360',       full: 'Identity360 (ID360)',color: 'text-teal-700',   bg: 'bg-teal-50 border-teal-200'   },
  AD360: { name: 'AD360',             full: 'AD360 (Suite)',      color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
}

let _id = 0
const f = (
  product: MEProductKey,
  category: string,
  feature: string,
  description: string,
  tags: string[] = [],
): ProductFeature => ({ id: `mef-${++_id}`, product, category, feature, description, tags })

export const PRODUCT_FEATURES: ProductFeature[] = [

  /* ================================================================ */
  /* ADManager Plus (ADMP)                                            */
  /* ================================================================ */

  // User Lifecycle
  f('ADMP','User Lifecycle','User provisioning (single & bulk)','Create, modify, delete AD users individually or in bulk via CSV/Excel import.', ['IGA','Lifecycle']),
  f('ADMP','User Lifecycle','Template-based provisioning','Pre-defined templates auto-populate attributes (OU, groups, manager) on user creation.', ['IGA']),
  f('ADMP','User Lifecycle','Joiner-Mover-Leaver (JML) automation','Automatically provision, update and deprovision users based on HR lifecycle events.', ['IGA','Lifecycle']),
  f('ADMP','User Lifecycle','HR system integrations','Native connectors: SAP, Workday, BambooHR, Zoho People, ADP, Oracle HCM, UKG.', ['IGA','Integration']),
  f('ADMP','User Lifecycle','Inactive account management','Detect and auto-disable or delete stale accounts based on configurable inactivity thresholds.', ['IGA','GRC']),
  f('ADMP','User Lifecycle','Account expiry management','Set and auto-enforce account expiry dates; notify managers before expiry.', ['IGA']),
  f('ADMP','User Lifecycle','User cloning','Provision new users by cloning group memberships and attributes from an existing user.', ['IGA']),
  f('ADMP','User Lifecycle','Scheduled automation','Run provisioning/deprovisioning jobs on schedule without manual intervention.', ['IGA','Automation']),

  // RBAC & Governance
  f('ADMP','RBAC & Governance','Role mining','Analyse existing access patterns across AD to discover and define roles.', ['IGA','GRC']),
  f('ADMP','RBAC & Governance','Role-based provisioning','Assign group memberships and permissions based on user role or department.', ['IGA','Zero Trust']),
  f('ADMP','RBAC & Governance','Segregation of Duties (SoD)','Define conflicting role pairs; alert or block when a user is assigned both.', ['GRC & Compliance','IGA']),
  f('ADMP','RBAC & Governance','Access certification / reviews','Run scheduled or ad-hoc access review campaigns with manager approval for each access right.', ['GRC & Compliance','IGA']),
  f('ADMP','RBAC & Governance','Least-privilege enforcement','Provision only the minimum access required; flag over-provisioned accounts.', ['Zero Trust','GRC & Compliance']),
  f('ADMP','RBAC & Governance','Service account lifecycle','Create, manage, and expire service accounts with workflow-based approval.', ['NHI','GRC & Compliance']),

  // Workflows
  f('ADMP','Workflows','Multi-level approval workflows','Route provisioning requests through configurable approval chains with escalation.', ['IGA']),
  f('ADMP','Workflows','Custom approval chains','Define different approvers per request type, department, or resource.', ['IGA']),
  f('ADMP','Workflows','Email notifications & escalations','Notify approvers and escalate overdue requests automatically.', ['IGA']),
  f('ADMP','Workflows','Helpdesk delegation','Scope-limited admin roles for helpdesk staff (OU-level, department-level).', ['IGA']),

  // Microsoft 365 & Exchange
  f('ADMP','Microsoft 365 & Exchange','Exchange/M365 mailbox management','Create, modify, delete mailboxes; manage Exchange attributes and mail settings.', ['IGA']),
  f('ADMP','Microsoft 365 & Exchange','Microsoft 365 license management','Assign, reclaim, and report on M365 licenses as part of provisioning workflows.', ['IGA','Cloud IGA']),
  f('ADMP','Microsoft 365 & Exchange','Distribution & security group management','Create and manage mail-enabled and security groups including nested groups.', ['IGA']),
  f('ADMP','Microsoft 365 & Exchange','Google Workspace provisioning','Provision and manage Google Workspace users and groups alongside AD.', ['IGA','Cloud IGA']),
  f('ADMP','Microsoft 365 & Exchange','Teams provisioning','Automate Microsoft Teams membership as part of onboarding workflows.', ['IGA']),

  // Compliance & Audit
  f('ADMP','Compliance & Audit','SOX compliance reports','Pre-built Sarbanes-Oxley reports covering access controls and privileged user activity.', ['GRC & Compliance']),
  f('ADMP','Compliance & Audit','HIPAA compliance reports','User access and audit reports mapped to HIPAA access control requirements.', ['GRC & Compliance']),
  f('ADMP','Compliance & Audit','GDPR compliance reports','Reports for user data access, stale accounts, and consent tracking.', ['GRC & Compliance']),
  f('ADMP','Compliance & Audit','PCI DSS compliance reports','Payment card industry access control and segregation of duties reports.', ['GRC & Compliance']),
  f('ADMP','Compliance & Audit','ISO 27001 reports','Access management reports aligned to ISO 27001 controls.', ['GRC & Compliance']),
  f('ADMP','Compliance & Audit','Custom report builder','Build custom reports with any AD attribute combination and schedule delivery.', ['GRC & Compliance']),
  f('ADMP','Compliance & Audit','Admin action audit trail','Immutable log of every admin action with before/after change capture.', ['GRC & Compliance']),
  f('ADMP','Compliance & Audit','SIEM integration','Forward audit events to Splunk, ArcSight, IBM QRadar, etc.', ['GRC & Compliance','Integration']),

  /* ================================================================ */
  /* ADSelfService Plus (ADSSP)                                       */
  /* ================================================================ */

  // SSPR
  f('ADSSP','Self-Service Password Reset','Password reset without helpdesk','Users reset their own expired or forgotten passwords via web portal or Windows login screen.', ['SSPR']),
  f('ADSSP','Self-Service Password Reset','Account unlock','Users unlock their own locked-out AD accounts without IT intervention.', ['SSPR']),
  f('ADSSP','Self-Service Password Reset','VPN-less remote reset','Reset password from outside the corporate network without a VPN connection.', ['SSPR','Zero Trust']),
  f('ADSSP','Self-Service Password Reset','Password expiry notification','Email/SMS reminders to users before their password expires.', ['SSPR']),
  f('ADSSP','Self-Service Password Reset','Password strength enforcement','Real-time password strength meter with custom complexity rules and banned-word lists.', ['SSPR','GRC & Compliance']),

  // MFA
  f('ADSSP','Multi-Factor Authentication','TOTP authenticator apps','Supports Google Authenticator, Microsoft Authenticator, Authy and any RFC 6238-compliant app.', ['Zero Trust','MFA']),
  f('ADSSP','Multi-Factor Authentication','Push notification MFA','Approve or deny login with a single tap on a mobile app.', ['Zero Trust','MFA']),
  f('ADSSP','Multi-Factor Authentication','Email OTP','One-time password sent to a registered email address.', ['Zero Trust','MFA']),
  f('ADSSP','Multi-Factor Authentication','SMS OTP','One-time password sent via SMS to a registered phone number.', ['Zero Trust','MFA']),
  f('ADSSP','Multi-Factor Authentication','FIDO2 / Passkeys / WebAuthn','Phishing-resistant hardware security keys and device-based passkeys.', ['Zero Trust','MFA','PQC']),
  f('ADSSP','Multi-Factor Authentication','YubiKey / hardware tokens','Support for FIDO2 and OTP-based hardware tokens from Yubico and others.', ['Zero Trust','MFA']),
  f('ADSSP','Multi-Factor Authentication','Biometric (fingerprint / face)','Device biometric as an MFA factor for Windows Hello and mobile.', ['Zero Trust','MFA']),
  f('ADSSP','Multi-Factor Authentication','Security questions','Knowledge-based authentication as a secondary factor.', ['MFA']),
  f('ADSSP','Multi-Factor Authentication','Duo Security integration','Use Duo as an MFA provider alongside native factors.', ['MFA','Integration']),

  // Adaptive MFA
  f('ADSSP','Adaptive / Risk-Based MFA','Location-based policies','Require MFA only for logins from untrusted countries or IP ranges.', ['Zero Trust','AI & Agentic']),
  f('ADSSP','Adaptive / Risk-Based MFA','Device trust','Skip MFA for managed/enrolled devices; enforce it for unmanaged ones.', ['Zero Trust']),
  f('ADSSP','Adaptive / Risk-Based MFA','Time-of-day policies','Enforce stricter authentication outside business hours.', ['Zero Trust']),
  f('ADSSP','Adaptive / Risk-Based MFA','Trusted device registration','Allow users to mark a device as trusted to reduce friction on repeat logins.', ['Zero Trust']),
  f('ADSSP','Adaptive / Risk-Based MFA','Conditional bypass for trusted IPs','Bypass MFA for known corporate IPs (office, VPN exit nodes).', ['Zero Trust']),

  // Endpoint MFA
  f('ADSSP','Endpoint MFA','Windows login MFA (Credential Provider)','MFA enforcement at the Windows logon screen — even before the OS loads.', ['Zero Trust','Endpoint']),
  f('ADSSP','Endpoint MFA','macOS login MFA','MFA for macOS system login.', ['Zero Trust','Endpoint']),
  f('ADSSP','Endpoint MFA','Linux login MFA','MFA for Linux PAM-based login.', ['Zero Trust','Endpoint']),
  f('ADSSP','Endpoint MFA','RDP session MFA','MFA challenge when a user initiates an RDP remote desktop session.', ['Zero Trust','Endpoint']),
  f('ADSSP','Endpoint MFA','VPN MFA (RADIUS)','Enforce MFA at the VPN gateway via RADIUS integration.', ['Zero Trust','Network Security']),
  f('ADSSP','Endpoint MFA','Offline MFA','MFA works when the device has no network connectivity (cached credentials).', ['Zero Trust','Endpoint']),

  // Passwordless
  f('ADSSP','Passwordless','FIDO2 passkey login','Complete passwordless login using device-bound passkeys.', ['Zero Trust','MFA']),
  f('ADSSP','Passwordless','QR code login','Log in by scanning a QR code with an enrolled mobile device.', ['Zero Trust']),
  f('ADSSP','Passwordless','Magic link (email-based)','Receive a one-click login link via email — no password needed.', ['Zero Trust']),

  // SSO
  f('ADSSP','Single Sign-On','SAML 2.0 SSO','IdP-initiated and SP-initiated SAML SSO for any SAML-compliant SaaS app.', ['Zero Trust','Cloud IGA']),
  f('ADSSP','Single Sign-On','OAuth 2.0 / OIDC','Modern token-based SSO for apps supporting OpenID Connect.', ['Zero Trust','Cloud IGA']),
  f('ADSSP','Single Sign-On','100+ pre-built app connectors','Out-of-box SSO for Salesforce, AWS, ServiceNow, Workday, Slack, etc.', ['Cloud IGA','Integration']),
  f('ADSSP','Single Sign-On','Custom SAML app support','Configure SSO for any custom internal or external app via SAML metadata.', ['Cloud IGA']),

  // Self-Service Directory
  f('ADSSP','Self-Service Directory','Employee profile self-update','Employees update their own contact info, photo, manager without IT.', ['IGA']),
  f('ADSSP','Self-Service Directory','Employee directory & org chart','Self-service searchable employee directory with org chart view.', ['IGA']),

  /* ================================================================ */
  /* PAM360                                                           */
  /* ================================================================ */

  // Discovery
  f('PAM360','Discovery & Onboarding','Privileged account discovery','Auto-discover privileged accounts across AD, local systems, databases, network devices, cloud.', ['NHI','Privileged Access']),
  f('PAM360','Discovery & Onboarding','Auto-onboarding of discovered accounts','Discovered accounts are auto-imported into the vault based on policy rules.', ['NHI','Privileged Access']),
  f('PAM360','Discovery & Onboarding','Periodic re-discovery scans','Scheduled scans keep the privileged account inventory current.', ['NHI','GRC & Compliance']),

  // Vaulting
  f('PAM360','Password Vaulting','AES-256 encrypted credential vault','All passwords stored encrypted with hardware-backed key management.', ['Privileged Access','GRC & Compliance']),
  f('PAM360','Password Vaulting','Password checkout / check-in','Controlled credential access — users check out passwords and return them after use.', ['Privileged Access','Zero Trust']),
  f('PAM360','Password Vaulting','Dual control (4-eye principle)','Password reveal requires a second approver — no single-person access to critical credentials.', ['Privileged Access','GRC & Compliance']),
  f('PAM360','Password Vaulting','Emergency / break-glass access','Override workflow for emergencies with mandatory post-access justification and alert.', ['Privileged Access']),
  f('PAM360','Password Vaulting','Time-bound password sharing','Share credentials with a specific user for a defined time window; auto-revoke after.', ['Privileged Access','Zero Trust']),

  // Auto-Rotation
  f('PAM360','Password Rotation','Scheduled auto-rotation','Automatically rotate passwords on a configurable schedule without disrupting services.', ['NHI','Privileged Access']),
  f('PAM360','Password Rotation','On-demand password rotation','Rotate any credential instantly on request.', ['NHI','Privileged Access']),
  f('PAM360','Password Rotation','Post-session rotation','Password is automatically changed after every privileged session ends.', ['NHI','Privileged Access','Zero Trust']),
  f('PAM360','Password Rotation','Custom rotation scripts','Define custom rotation logic for proprietary or legacy systems.', ['NHI','Privileged Access']),

  // JIT
  f('PAM360','Just-in-Time Access','JIT privilege elevation','Grant elevated privileges on demand; auto-revoke when the session or time window ends.', ['Zero Trust','Privileged Access','NHI']),
  f('PAM360','Just-in-Time Access','Just-enough access','Grant minimum required permissions for a specific task, not full admin rights.', ['Zero Trust','Privileged Access']),
  f('PAM360','Just-in-Time Access','Request & approval for JIT','Users submit JIT access requests; approvers grant time-bound elevation via workflow.', ['Privileged Access','GRC & Compliance']),

  // Sessions
  f('PAM360','Session Management','RDP session recording','Full video recording of every RDP session for forensic and compliance use.', ['Privileged Access','GRC & Compliance']),
  f('PAM360','Session Management','SSH session recording','Text log of all keystrokes and commands in SSH sessions.', ['Privileged Access','GRC & Compliance']),
  f('PAM360','Session Management','Browser-based session recording','Record sessions launched from the PAM360 web UI — no client needed.', ['Privileged Access']),
  f('PAM360','Session Management','Live session monitoring','Admins can watch active privileged sessions in real time.', ['Privileged Access','GRC & Compliance']),
  f('PAM360','Session Management','Session termination','Instantly kill a suspicious or policy-violating session from the admin console.', ['Privileged Access']),
  f('PAM360','Session Management','Searchable session recordings','Full-text search across recorded session logs to find specific commands or events.', ['Privileged Access','GRC & Compliance']),

  // Remote Access
  f('PAM360','Remote Access Gateway','Browser-based privileged remote access','Launch RDP/SSH sessions from a browser — no VPN, no agent on the target.', ['Privileged Access','Zero Trust']),
  f('PAM360','Remote Access Gateway','Agentless access','No software required on target servers; access via PAM360 gateway.', ['Privileged Access']),

  // Secrets / AAPM
  f('PAM360','Secrets Management (AAPM)','Eliminate hardcoded credentials','Applications retrieve credentials via API instead of embedding them in code.', ['NHI','AI & Agentic','DevSecOps']),
  f('PAM360','Secrets Management (AAPM)','CI/CD pipeline secrets','Integrates with Jenkins, Ansible, Terraform, Kubernetes for automated secrets retrieval.', ['NHI','AI & Agentic','DevSecOps']),
  f('PAM360','Secrets Management (AAPM)','Secrets vault','Centralised store for API keys, tokens, database passwords used by applications and pipelines.', ['NHI','AI & Agentic']),
  f('PAM360','Secrets Management (AAPM)','Automated secrets rotation','Rotate application secrets on a schedule without application downtime.', ['NHI','Privileged Access']),

  // SSH Keys & Certs
  f('PAM360','SSH Key Management','SSH key discovery','Discover all SSH public/private keys deployed across infrastructure.', ['NHI','GRC & Compliance']),
  f('PAM360','SSH Key Management','SSH key rotation & cleanup','Rotate authorised keys and remove orphaned or unused keys.', ['NHI','GRC & Compliance']),
  f('PAM360','SSH Key Management','Key-to-account mapping','Map each SSH key to its owner and the target accounts it can access.', ['NHI']),
  f('PAM360','SSL/TLS Certificate Management','Certificate discovery','Discover SSL/TLS certificates across internal servers and public endpoints.', ['NHI','GRC & Compliance']),
  f('PAM360','SSL/TLS Certificate Management','Expiry alerts','Automated alerts when certificates are within configurable days of expiry.', ['NHI','GRC & Compliance']),
  f('PAM360','SSL/TLS Certificate Management','Certificate renewal workflow','Workflow-driven certificate renewal and deployment to target servers.', ['NHI']),

  // Cloud & Database
  f('PAM360','Cloud Credentials','AWS IAM key management','Discover, vault, and rotate AWS access keys and IAM user credentials.', ['Cloud IGA','NHI']),
  f('PAM360','Cloud Credentials','Azure service principal management','Manage and rotate Azure AD app secrets and service principal credentials.', ['Cloud IGA','NHI']),
  f('PAM360','Cloud Credentials','GCP service account key rotation','Vault and rotate Google Cloud service account keys.', ['Cloud IGA','NHI']),
  f('PAM360','Database Credentials','Database credential management','Vault and manage credentials for Oracle, MSSQL, MySQL, PostgreSQL.', ['Privileged Access','NHI']),
  f('PAM360','Database Credentials','Database session recording','Record all SQL queries executed during a privileged database session.', ['Privileged Access','GRC & Compliance']),

  // Compliance
  f('PAM360','Compliance','PCI DSS privileged access reports','Pre-built reports for PCI DSS requirement 7, 8 and 10.', ['GRC & Compliance']),
  f('PAM360','Compliance','HIPAA privileged user reports','Access and session audit reports for HIPAA §164.312.', ['GRC & Compliance']),
  f('PAM360','Compliance','Ticketing integration','Tie privileged access to ServiceNow / Jira tickets — access denied without a valid ticket.', ['GRC & Compliance','Integration']),

  /* ================================================================ */
  /* Identity360 / ID360                                              */
  /* ================================================================ */

  f('ID360','Multi-Directory','Entra ID (Azure AD) management','Full user lifecycle management for Microsoft Entra ID from a single console.', ['Cloud IGA','IGA']),
  f('ID360','Multi-Directory','Google Workspace management','Provision, modify and deprovision Google Workspace users and groups.', ['Cloud IGA','IGA']),
  f('ID360','Multi-Directory','Unified identity view','Single pane of glass showing a user\'s identities and access across all connected directories.', ['Cloud IGA','IGA']),
  f('ID360','Multi-Directory','Cross-directory sync','Sync user attributes and group memberships between AD, Entra ID and Google Workspace.', ['Cloud IGA','IGA']),

  f('ID360','User Lifecycle (Cloud)','Cloud user provisioning','Automate onboarding across cloud directories triggered by HR system events.', ['Cloud IGA','IGA']),
  f('ID360','User Lifecycle (Cloud)','Joiner-Mover-Leaver (cloud)','JML workflows for cloud-only users with approval-based provisioning.', ['Cloud IGA','IGA']),
  f('ID360','User Lifecycle (Cloud)','Bulk operations (cloud)','Bulk create, modify, delete cloud users via CSV or API.', ['Cloud IGA','IGA']),

  f('ID360','App Provisioning (SCIM)','SCIM 2.0 provisioning','Automatic user account creation and deprovisioning in 100+ SaaS apps via SCIM.', ['Cloud IGA','IGA']),
  f('ID360','App Provisioning (SCIM)','Attribute mapping','Custom mapping of identity attributes to app-specific fields.', ['Cloud IGA']),
  f('ID360','App Provisioning (SCIM)','Deprovisioning on termination','Automatically revoke SaaS app access when a user is offboarded.', ['Cloud IGA','IGA']),

  f('ID360','SSO & MFA','SAML / OIDC SSO','Single Sign-On for cloud and SaaS apps via SAML 2.0 and OpenID Connect.', ['Zero Trust','Cloud IGA']),
  f('ID360','SSO & MFA','Adaptive MFA','Risk-based MFA enforcement based on location, device and behaviour signals.', ['Zero Trust','AI & Agentic']),
  f('ID360','SSO & MFA','Conditional access policies','Define access policies based on user, device, network and risk level.', ['Zero Trust']),

  f('ID360','Access Governance','Access reviews (cloud)','Certification campaigns for cloud app and directory access.', ['GRC & Compliance','Cloud IGA']),
  f('ID360','Access Governance','Role-based access control','Assign app access based on role/group membership.', ['Cloud IGA','IGA']),
  f('ID360','Access Governance','Access request portal','Users request app access through a self-service portal with approval workflow.', ['Cloud IGA','IGA']),

  /* ================================================================ */
  /* AD360 (Suite — bundles ADMP + ADSSP + ADAudit + RecoveryMgr)   */
  /* ================================================================ */

  f('AD360','ADAudit Plus — Change Auditing','Real-time AD change auditing','Every change to AD objects (users, groups, GPOs, OUs) is logged in real time.', ['GRC & Compliance','Zero Trust']),
  f('AD360','ADAudit Plus — Change Auditing','Logon / logoff audit','Track every authentication event, failed login, and account lockout across the domain.', ['GRC & Compliance','Zero Trust']),
  f('AD360','ADAudit Plus — Change Auditing','GPO change auditing','Track changes to Group Policy Objects with before/after values.', ['GRC & Compliance']),
  f('AD360','ADAudit Plus — Change Auditing','File server change auditing','Audit read, write, delete, rename events on Windows file servers.', ['GRC & Compliance','Data Security']),
  f('AD360','ADAudit Plus — Change Auditing','Privileged user monitoring','Dedicated monitoring of Domain Admin and other privileged group members.', ['Privileged Access','GRC & Compliance']),

  f('AD360','ADAudit Plus — UBA & Threat Detection','ML-based anomaly detection','Baseline normal behaviour per user; alert on deviations (login time, location, volume).', ['AI & Agentic','Zero Trust','GRC & Compliance']),
  f('AD360','ADAudit Plus — UBA & Threat Detection','Ransomware detection','Detect mass file rename/encrypt events and trigger automatic response (disable account, block share).', ['Threat Intelligence','GRC & Compliance']),
  f('AD360','ADAudit Plus — UBA & Threat Detection','Insider threat detection','Flag privilege abuse, data exfiltration patterns, and policy violations.', ['Threat Intelligence','Zero Trust']),
  f('AD360','ADAudit Plus — UBA & Threat Detection','Real-time alert engine','Email and SMS alerts on critical events with configurable severity thresholds.', ['GRC & Compliance']),
  f('AD360','ADAudit Plus — UBA & Threat Detection','Forensic log search','Search across years of AD audit logs with keyword, attribute, and date filters.', ['GRC & Compliance']),
  f('AD360','ADAudit Plus — UBA & Threat Detection','SIEM integration','Forward enriched events to Splunk, IBM QRadar, ArcSight, Microsoft Sentinel.', ['GRC & Compliance','Integration']),

  f('AD360','RecoveryManager Plus — Backup & Recovery','AD object backup','Scheduled backup of users, groups, OUs, GPOs, and computer objects.', ['GRC & Compliance']),
  f('AD360','RecoveryManager Plus — Backup & Recovery','Granular attribute restore','Restore individual attributes of an object without rolling back the entire object.', ['GRC & Compliance']),
  f('AD360','RecoveryManager Plus — Backup & Recovery','Point-in-time restore','Restore AD to a specific point in time — critical for ransomware and accidental deletion.', ['GRC & Compliance','Threat Intelligence']),
  f('AD360','RecoveryManager Plus — Backup & Recovery','Deleted object recovery','Recover deleted AD objects (users, groups, computers) from backup.', ['GRC & Compliance']),
  f('AD360','RecoveryManager Plus — Backup & Recovery','Azure AD / Entra ID backup','Backup and restore Entra ID objects including users, groups, app registrations.', ['Cloud IGA','GRC & Compliance']),

  f('AD360','Unified Suite','Single admin console','One web console for all AD management, audit, self-service and recovery functions.', ['IGA']),
  f('AD360','Unified Suite','Unified identity risk dashboard','Consolidated view of risky users, stale accounts, policy violations across all modules.', ['GRC & Compliance','IGA']),
  f('AD360','Unified Suite','Cross-module event correlation','Link an audit event in ADAudit Plus to the user\'s access rights in ADManager Plus.', ['GRC & Compliance','AI & Agentic']),
]
