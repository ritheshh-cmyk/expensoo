# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-human.spec.ts >> 🧑 Human E2E — Admin Full Journey >> 13 · Page scrolls correctly — no overflow bug
- Location: e2e\admin-human.spec.ts:372:3

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
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
            - link "Suppliers" [ref=e29] [cursor=pointer]:
              - /url: /suppliers
              - img [ref=e30]
              - text: Suppliers
          - listitem [ref=e35]:
            - link "Expenditures" [ref=e36] [cursor=pointer]:
              - /url: /expenditures
              - img [ref=e37]
              - text: Expenditures
          - listitem [ref=e40]:
            - link "Bills" [ref=e41] [cursor=pointer]:
              - /url: /bills
              - img [ref=e42]
              - text: Bills
          - listitem [ref=e45]:
            - link "Reports" [ref=e46] [cursor=pointer]:
              - /url: /reports
              - img [ref=e47]
              - text: Reports
          - listitem [ref=e50]:
            - link "Settings" [ref=e51] [cursor=pointer]:
              - /url: /settings
              - img [ref=e52]
              - text: Settings
          - listitem [ref=e55]:
            - link "admin" [ref=e56] [cursor=pointer]:
              - /url: /admin
              - img [ref=e57]
              - text: admin
          - listitem [ref=e59]:
            - generic [ref=e60]:
              - generic [ref=e61]: Logged in as
              - generic [ref=e62]: admin
            - button "Sign out" [ref=e63] [cursor=pointer]:
              - img [ref=e64]
              - text: Sign out
    - generic [ref=e67]:
      - banner [ref=e68]:
        - generic [ref=e69]:
          - generic [ref=e71]:
            - heading "CallMeMobiles" [level=1] [ref=e72]
            - paragraph [ref=e73]: Professional Repair Management
          - generic [ref=e75]: System Online
          - generic [ref=e77]:
            - button [ref=e79] [cursor=pointer]:
              - img [ref=e80]
            - button "Notifications" [ref=e82] [cursor=pointer]:
              - img [ref=e83]
              - generic [ref=e86]: Notifications
            - button "admin admin" [ref=e88] [cursor=pointer]:
              - img [ref=e90]
              - generic [ref=e93]:
                - generic [ref=e94]: admin
                - generic [ref=e95]:
                  - img [ref=e96]
                  - text: admin
              - img [ref=e98]
      - navigation [ref=e102]:
        - link [ref=e103] [cursor=pointer]:
          - /url: /
          - img [ref=e104]
        - generic [ref=e107]:
          - img [ref=e108]
          - generic [ref=e110]: admin
      - main [ref=e111]:
        - generic [ref=e114]:
          - generic [ref=e116]:
            - generic [ref=e117]:
              - heading "Administration" [level=1] [ref=e118]
              - generic [ref=e119]:
                - img [ref=e120]
                - text: admin
            - paragraph [ref=e122]:
              - img [ref=e123]
              - text: Full system control
          - tablist [ref=e126]:
            - tab "Overview" [ref=e127] [cursor=pointer]:
              - img [ref=e128]
              - generic [ref=e130]: Overview
            - tab "Users" [active] [selected] [ref=e131] [cursor=pointer]:
              - img [ref=e132]
              - generic [ref=e137]: Users
            - tab "Permissions" [ref=e138] [cursor=pointer]:
              - img [ref=e139]
              - generic [ref=e141]: Permissions
            - tab "Audit Log" [ref=e142] [cursor=pointer]:
              - img [ref=e143]
              - generic [ref=e145]: Audit Log
            - tab "Export" [ref=e146] [cursor=pointer]:
              - img [ref=e147]
              - generic [ref=e150]: Export
            - tab "Sessions" [ref=e151] [cursor=pointer]:
              - img [ref=e152]
              - generic [ref=e154]: Sessions
          - generic [ref=e156]:
            - generic [ref=e157]:
              - generic [ref=e158]:
                - heading "User Management" [level=3] [ref=e159]:
                  - img [ref=e160]
                  - text: User Management
                - paragraph [ref=e162]: Full control — create, roles, passwords, delete
              - button "Refresh" [ref=e164] [cursor=pointer]:
                - img [ref=e165]
                - text: Refresh
            - generic [ref=e170]:
              - button "Create User" [ref=e171] [cursor=pointer]:
                - img [ref=e172]
                - text: Create User
              - generic [ref=e175]:
                - generic [ref=e177] [cursor=pointer]:
                  - generic [ref=e178]:
                    - generic [ref=e179]: a
                    - generic [ref=e180]:
                      - generic [ref=e181]:
                        - text: admin
                        - generic [ref=e182]: (you)
                      - generic [ref=e183]: "ID #1"
                  - generic [ref=e184]:
                    - generic [ref=e185]: Admin
                    - img [ref=e187]
                - generic [ref=e190] [cursor=pointer]:
                  - generic [ref=e191]:
                    - generic [ref=e192]: r
                    - generic [ref=e193]:
                      - generic [ref=e194]: rajshekhar
                      - generic [ref=e195]: "ID #2"
                  - generic [ref=e196]:
                    - generic [ref=e197]: Owner
                    - img [ref=e199]
                - generic [ref=e202] [cursor=pointer]:
                  - generic [ref=e203]:
                    - generic [ref=e204]: s
                    - generic [ref=e205]:
                      - generic [ref=e206]: sravan
                      - generic [ref=e207]: "ID #3"
                  - generic [ref=e208]:
                    - generic [ref=e209]: Worker
                    - img [ref=e211]
              - paragraph [ref=e213]: 3 users total
  - region "Notifications (F8)":
    - list
```