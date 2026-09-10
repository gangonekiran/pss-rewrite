# Active Form Feature

## Single-route workflow

The feature uses exactly one route:

`/active-form`

1. Open `/active-form`.
2. Load existing clients through the existing `clientService.getAll()` endpoint.
3. User selects an existing client and the application obtains its `ChildID`.
4. Only after a client is selected does the Active Form API load client information and lookup data.
5. The Active Form editor always starts blank for the selected client. Existing Active Form records are not automatically loaded or copied.
6. The first Save calls `POST /active-forms/{childId}` and creates the `stblActiveForm` record.
7. The returned Active Form ID is kept in React state while the URL remains `/active-form`.
8. Subsequent Saves call `PUT /active-forms/{childId}/{id}` for that same record.

There is no `/active-form/:childId` or `/active-form/:childId/:id` route.

## API base URL

The shared Axios instance already contains the `/api` prefix when `VITE_API_URL` is configured as `http://localhost:5000/api`. Therefore this feature uses `/active-forms`, not `/api/active-forms`, to avoid requests such as `/api/api/active-forms/...`.
