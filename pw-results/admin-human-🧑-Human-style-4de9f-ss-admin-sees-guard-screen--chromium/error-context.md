# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-human.spec.ts >> 🧑 Human-style E2E — Admin Full Journey >> Step 8 — Worker cannot access admin (sees guard screen)
- Location: e2e\admin-human.spec.ts:278:3

# Error details

```
TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - button [ref=e6] [cursor=pointer]:
      - img [ref=e7]
    - generic [ref=e11]:
      - generic [ref=e12]:
        - img [ref=e14]
        - generic [ref=e16]: CallMeMobiles
      - generic [ref=e17]:
        - generic [ref=e18]:
          - paragraph [ref=e19]: Repair Shop Management
          - heading "MANAGE YOUR REPAIRS SMARTER" [level=1] [ref=e20]:
            - text: MANAGE YOUR
            - text: REPAIRS SMARTER
        - paragraph [ref=e21]: Complete control over every job
        - list [ref=e22]:
          - listitem [ref=e23]:
            - img [ref=e24]
            - text: Track every repair job from intake to pickup
          - listitem [ref=e27]:
            - img [ref=e28]
            - text: Live revenue & profit dashboards
          - listitem [ref=e31]:
            - img [ref=e32]
            - text: Role-based access for admin, owner & workers
          - listitem [ref=e35]:
            - img [ref=e36]
            - text: Real-time SMS billing and customer alerts
        - generic [ref=e39]:
          - img [ref=e40]
          - generic [ref=e42]:
            - paragraph [ref=e43]: Live System
            - paragraph [ref=e44]: Real-time updates across all devices
      - paragraph [ref=e45]: © 2026 CallMeMobiles · Repair Shop Management System
    - generic [ref=e47]:
      - generic [ref=e48]:
        - heading "Sign in" [level=2] [ref=e49]
        - paragraph [ref=e50]: Enter your credentials to access the dashboard
      - generic [ref=e51]:
        - generic [ref=e52]:
          - text: Username
          - textbox "Username" [ref=e53]:
            - /placeholder: Enter your username
            - text: e2etestuser
        - generic [ref=e54]:
          - text: Password
          - generic [ref=e55]:
            - textbox "Password" [ref=e56]:
              - /placeholder: Enter your password
              - text: NewPass@2025
            - button [ref=e57] [cursor=pointer]:
              - img [ref=e58]
        - alert [ref=e61]:
          - img [ref=e62]
          - text: Authentication required
        - generic [ref=e64]:
          - generic [ref=e65]:
            - checkbox "Remember me" [ref=e66] [cursor=pointer]
            - generic [ref=e67] [cursor=pointer]: Remember me
          - link "Forgot password?" [ref=e68] [cursor=pointer]:
            - /url: /auth/forgot-password
        - button "Sign In" [ref=e69] [cursor=pointer]
      - generic [ref=e70]:
        - text: Need help?
        - link "Call Support" [ref=e71] [cursor=pointer]:
          - /url: tel:+919392404104
  - region "Notifications (F8)":
    - list
```