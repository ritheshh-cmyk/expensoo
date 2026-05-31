# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-full.spec.ts >> 🖥 Admin Page UI — browser tests >> Worker cannot access /admin — gets redirected
- Location: e2e\admin-full.spec.ts:256:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e6]:
      - generic [ref=e8]:
        - img [ref=e10]
        - generic [ref=e12]:
          - heading "CallMeMobiles" [level=1] [ref=e13]
          - paragraph [ref=e14]: Mobile Repair Tracker
      - navigation [ref=e15]:
        - list [ref=e16]:
          - listitem [ref=e17]:
            - link "Dashboard" [ref=e18] [cursor=pointer]:
              - /url: /dashboard
              - img [ref=e19]
              - text: Dashboard
          - listitem [ref=e24]:
            - link "Transactions" [ref=e25] [cursor=pointer]:
              - /url: /transactions
              - img [ref=e26]
              - text: Transactions
          - listitem [ref=e28]:
            - link "Bills" [ref=e29] [cursor=pointer]:
              - /url: /bills
              - img [ref=e30]
              - text: Bills
          - listitem [ref=e33]:
            - link "Settings" [ref=e34] [cursor=pointer]:
              - /url: /settings
              - img [ref=e35]
              - text: Settings
          - listitem [ref=e38]:
            - generic [ref=e39]:
              - generic [ref=e40]: Logged in as
              - generic [ref=e41]: worker
            - button "Sign out" [ref=e42] [cursor=pointer]:
              - img [ref=e43]
              - text: Sign out
    - generic [ref=e46]:
      - banner [ref=e47]:
        - generic [ref=e48]:
          - generic [ref=e50]:
            - heading "CallMeMobiles" [level=1] [ref=e51]
            - paragraph [ref=e52]: Professional Repair Management
          - generic [ref=e54]: System Online
          - generic [ref=e56]:
            - button [ref=e58] [cursor=pointer]:
              - img [ref=e59]
            - button "Notifications" [ref=e61] [cursor=pointer]:
              - img [ref=e62]
              - generic [ref=e65]: Notifications
            - button "workerui_1780260795953 worker" [ref=e67] [cursor=pointer]:
              - img [ref=e69]
              - generic [ref=e72]:
                - generic [ref=e73]: workerui_1780260795953
                - generic [ref=e74]:
                  - img [ref=e75]
                  - text: worker
              - img [ref=e77]
      - navigation [ref=e81]:
        - link [ref=e82] [cursor=pointer]:
          - /url: /
          - img [ref=e83]
        - generic [ref=e86]:
          - img [ref=e87]
          - generic [ref=e89]: admin
      - main [ref=e90]:
        - generic [ref=e94]:
          - img [ref=e96]
          - generic [ref=e98]:
            - heading "Admin Access Required" [level=2] [ref=e99]
            - paragraph [ref=e100]: Only administrators can access this page.
          - generic [ref=e101]:
            - text: "Logged in as:"
            - strong [ref=e103]: workerui_1780260795953
            - text: · worker
  - region "Notifications (F8)":
    - list
```