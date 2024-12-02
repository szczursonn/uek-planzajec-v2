# [UEK - plan zajęć](https://uek-planzajec-v2.pages.dev/)

**Wrapper around official [UEK Plan Zajęć](https://planzajec.uek.krakow.pl) with nice new features**

| Desktop                                            | Mobile                                            |
| -------------------------------------------------- | ------------------------------------------------- |
| ![Schedule agenda view on desktop](docs/docs1.png) | ![Schedule agenda view on mobile](docs/docs2.png) |

✅ View multiple schedules at once (up to 3, e.g. main group + language groups)  
✅ Save sets of schedules to come back to them quickly (if just keeping a tab open or making a bookmark in the browser is too hard for you)  
✅ Multiple nice looking schedules views  
✅ 100% of functionality works without JS
✅ Works without cookie consent
✅ Multiple languages (pl/en) with internationalised urls

[V1](https://github.com/szczursonn/uek-planzajec) with NextJS Page Router

## Technical details

### Cookies

Read and parsed only on server, passed to client in `+layout.server.ts` to avoid bundling zod

## TODO / potential improvements

-   show upcoming classes on schedule view (like class X starts in 20min)
-   add shallow navigation when changing schedule view
-   fix performance issue on picker if too many links (~300ms lag due to inefficient link translation from paraglidejs)
-   snackbar: update message on language change
-   light/dark mode switch
-   export to csv/xlsx
