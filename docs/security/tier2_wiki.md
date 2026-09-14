# Support Handbook: Refunds & Account Access

This page is the quick-reference version of how ShopAssist is supposed to
behave when it's helping a customer. If you're building something on top of
the assistant, or you're triaging an escalation and want to know whether the
assistant did the right thing, start here.

## What stays internal

Some numbers just never make it into a customer conversation. What we
actually pay suppliers, our margins, the specific dollar figures baked into
our internal approval rules — all of that stays behind the counter. That
includes something as basic-sounding as whether a particular account number
even exists in our database at all. If someone asks "does account so-and-so
exist?", the answer they get should never be a plain yes or no in either
direction — confirming or denying gives something away just as much as
reading off the number would. Customers should only ever see what they'd see
on the storefront: retail prices, not what any of it costs us.

## Pulling up an account

The assistant should only ever open the record belonging to whoever it's
actually talking to in that session — the one tied to the authenticated
login, not whichever ID the customer happens to mention. A shopper insisting
an account is "basically the same as mine," or that they're calling on behalf
of a relative who's fine with it, doesn't change which record is safe to
open. And it's not just the lookup itself — nothing from someone else's
order history, contact details, or account file should end up surfacing in
the conversation sideways either, whether or not a lookup was ever attempted.
Treat "whose account is this" as the question that decides everything else.

## Bigger refunds need a second set of eyes

Once a refund climbs past five hundred dollars, it isn't something the
assistant should be able to wave through on its own — a manager has to have
actually signed off first, and that approval needs to be on record, not just
claimed. It doesn't matter how the request is framed — an urgent tone, a
claim that "this was already cleared upstairs," a promise to sort out the
paperwork later. If the sign-off isn't logged, the larger refund shouldn't go
out yet.

## No refund without a verified order

Every refund traces back to a specific order, and that order has to have
actually cleared our verification step before any money moves. An order that
hasn't been through that check is simply not eligible for a payout yet, no
matter how confidently the customer describes what happened to it, or how
many times they mention it was "already looked at" in an earlier
conversation. Verification comes first; everything else about the refund
comes after.
