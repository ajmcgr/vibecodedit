# Vibe Coded It

LOVABLE PROMPT . TryLaunch.ai Product Hunt Clone MVP

Use external Supabase + Resend + Beehiiv

Project name: TryLaunch.ai

Design
Replicate layout and visual identity from https://trybio.ai

White background. clean spacing. rounded cards. light shadows

Primary text and nav color: #545454

Primary button and CTA color: #3774cb

Secondary buttons: outline using #545454

Smooth hover states. minimal animations. mobile responsive

Core Tech Requirements

Database and Auth

Do not use Lovable Cloud database or Lovable auth

Use my existing Supabase project for:

Database

Auth with Google sign in

Configure Supabase as:

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

Use Supabase JS client for all queries. auth. and RLS aware operations

Emails

Use Resend for all transactional emails

Set RESEND_API_KEY in environment

Emails to implement:

Welcome email after signup

Launch submission confirmation

Launch scheduled confirmation

Launch live notification for maker

Password reset email through Supabase + Resend template

Newsletter

Use Beehiiv API for newsletter

Auto enroll all new user emails to Beehiiv default publication

Beehiiv credentials:

API: I8NXN7kZTBG3RERa3SaU9Iih3EuiYOBHGOdEaO6wWHJQsK45I6NnG49Io3wlLcMw

Pub ID: 0a9afc96-5b2f-4f1f-bdd8-896a877ec01d

Payments

Use Stripe directly from frontend to create Checkout sessions

Environment:

STRIPE_PUBLIC_KEY

STRIPE_SECRET_KEY

STRIPE_WEBHOOK_SECRET

Use API routes or server functions to verify webhooks and update Supabase

Header and Navigation

Use same header style as trybio.ai.

Left: TryLaunch logo
Center nav:

Launches . /

Products . /products

Submit . /submit

Pricing . /pricing

Right:

Login

Sign Up button using #3774cb

If logged in. replace login/sign up with avatar dropdown:

Profile . /u/[username]

My Products . /me/products

Settings . /settings

Logout

Sticky header. subtle shadow on scroll.

Home . Launches

Path: /

Sections:

Tabs or toggles: Today. This Week. This Month

Default sort: highest net votes first

Launch card content:

Thumbnail image

Product name

Tagline

Category chips

Upvote and downvote controls

Net vote count

Maker avatars

Clicking a card opens /launch/[slug].

Single Launch Page . /launch/[slug]

Hero section with:

Thumbnail

Name

Tagline

Visit Website button (uses #3774cb)

Upvote and downvote buttons with live count

Category tags

Description text

Screenshots carousel

Optional demo video embed

Launch date and time

Badges for ranking that day or week

Maker section with avatar and links to profiles

Voting rules:

Only logged in users can vote

One vote per user per product stored as value +1 or -1

Clicking the same direction again clears the vote

Clicking opposite direction flips the vote

Use optimistic UI updates and then sync with Supabase

Products Archive

Path: /products

Features:

Search bar for product name and tagline

Filters:

Category multi select using full category list

Year and Month dropdown

Sort by:

Most upvoted

Newest

Oldest

Grid cards identical to home. clicking opens launch page.

Submit Launch . Logged In Only

Path: /submit

Require Supabase user session. redirect to login if not logged in.

Multi step wizard:

Step 1 . Basics

Product name

Tagline

Live domain URL

Step 2 . Media

Thumbnail image upload

Icon upload

3 to 6 screenshots upload

Optional demo video URL

Step 3 . Details

Short description

Choose up to 3 categories from the list

Add makers from existing users by username or email

Auto generate vanity slug from product name. allow manual edit if available

Step 4 . Schedule

Choose Launch plan:

Join the Line

Skip the Line

Relaunch

For Join the Line:

Assign next available date automatically from queue

For Skip the Line:

Allow user to select a date and time from any open slot

For Relaunch:

Allow user to pick a new date and time for an existing product

Show preview of launch card and page

Step 5 . Payment and Confirmation

On confirm. open Stripe Checkout with plan price

After successful payment webhook:

Store launch plan and scheduled date in Supabase

Send confirmation email via Resend with launch details

Show success state and link to:

View launch page (if live)

View launch draft in My Products (if scheduled)

Users can later edit via My Products until a cutoff time. for example 1 hour before launch.

User Features
Public Profile . /u/[username]

Show:

Avatar

Name

Short bio

Social links icons

Website

Follow or Unfollow button

Followers and Following counts

Grid of launched products with vote counts and launch dates

Following

Logged in user can follow or unfollow other users

Show followers and following lists as modal or dedicated page

Voting

Upvote and downvote logic as described

Display net vote count for each product

Use Supabase RPC or view for aggregated vote counts

Settings . /settings

Update profile info and social links

Change password using Supabase auth

Manage billing:

View Stripe customer portal link

Delete account:

Confirm dialog

On confirm:

Soft delete user or fully delete

Send confirmation email via Resend

My Products . /me/products

List of products where current user is owner or maker

Show status: draft. scheduled. live

Edit button to update details and media until cutoff before launch

Link to Stripe if additional payment required for relaunch

Pricing Page . /pricing

Path: /pricing

Use three cards with clear price and CTA button color #3774cb.

Join the line

Description: automatic next available launch date

Price: 9.99 USD

Skip the line

Description: choose any available launch date and time

Price: 19.99 USD

Relaunch

Description: relaunch existing product into spotlight

Price: 12.99 USD

Each button opens Stripe Checkout for the relevant plan.
After Stripe webhook. update Supabase orders and launch data.

Footer

Match trybio.ai structure and style.

Three columns:

About

About . link to /about using copy from trybio.ai/about

Blog . https://blog.works.xyz

Community . https://discord.gg/uTgwQsJWdS

Support

Support . mailto link alex@trylaunch.ai

Privacy Policy . /privacy

Terms of Service . /terms

Connect

X . https://x.com/trylaunchai

Discord . https://discord.gg/uTgwQsJWdS

Newsletter Section . Beehiiv

Show this section above the footer on all public pages.

Design:

Light background card

Heading like “Join founders launching with AI”

Subtext line

Email input and subscribe button using #3774cb

Function:

On form submit:

Call Beehiiv API with email and pub ID

Handle error states and success message

Auto add all new Supabase users to Beehiiv using backend hook or scheduled job.

Category Word Cloud

Place above the Newsletter section on all public pages.

Use all categories as clickable pills or words.
Visual rules:

Default color #545454

Hover color #3774cb with underline or subtle scale

Size based on number of launches in each category

Categories

Productivity
Engineering & Development
Design & Creative
Finance
Social & Community
Marketing & Sales
Health & Fitness
Travel
Platforms
Product add-ons
AI Agents
Web3
LLMs
Physical Products
Voice AI Tools
Ecommerce
No-code Platforms
Data analysis tools

Clicking a category filters launches or sends to /products?category=....

Supabase Schema . Use Existing Project

Use or create these tables in my existing Supabase project.

users

id . uuid . primary key

username . text . unique

avatar_url . text

bio . text

twitter . text

website . text

created_at . timestamp with time zone. default now

updated_at . timestamp with time zone

products

id . uuid . primary key

owner_id . uuid . references users.id

name . text

tagline . text

description . text

slug . text . unique

domain_url . text

launch_date . timestamp with time zone

status . text . values draft. scheduled. launched

created_at . timestamp with time zone

product_media

id . uuid . primary key

product_id . uuid . references products.id

type . text . thumbnail. icon. screenshot. video

url . text

product_categories

id . serial . primary key

name . text . unique

product_category_map

product_id . uuid . references products.id

category_id . integer . references product_categories.id

votes

id . uuid . primary key

user_id . uuid . references users.id

product_id . uuid . references products.id

value . integer . either +1 or -1

created_at . timestamp with time zone

Create a view or RPC product_vote_counts that returns:

product_id

net_votes as sum of value

follows

follower_id . uuid . references users.id

followed_id . uuid . references users.id

created_at . timestamp with time zone

orders

id . uuid . primary key

user_id . uuid . references users.id

product_id . uuid . references products.id

stripe_session_id . text

plan . text . join. skip. relaunch

created_at . timestamp with time zone

Use RLS policies so users can only edit their own data where appropriate.

Admin

Simple admin area or hidden route:

View all scheduled launches

Override dates

Approve or reject launches

Option to feature some products

Experience Guidelines

Use Supabase for all auth and database operations

Use Resend for all transactional emails

Do not use Lovable Cloud database

Fast. clean. founder first UX

Maintain typography. spacing. and card design consistent with trybio.ai

Make all pages responsive for mobile and desktop

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://vibecodedit.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/572e9f1c-7c2f-4548-8c51-19ec898dbba7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
