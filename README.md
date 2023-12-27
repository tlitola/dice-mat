# Dice-mat

Dovie'andi se tovya sagain - It's time to toss the dice

Dice-mat was originally a small project I build during the pandemic to help me and my friends roleplay online. Dice-mat gives the players ability to roll dice as if they were around one table. The rolls of one player are broadcasted to all others around the table, each of the players having ability to customise their die.

I rewrote dice-mat in typescript in 2023, while also updating to Next.js 14 with app router, making improvements to the code, core logic, UI and adding the ability to specify groups in which to share throws. The core idea of the project is, however, still the same: to offer a change to throw die online.

Dice-mat supports all common dice types from d6 to d20.

## Technologies

The basic UI of the app is build using Next.js with app router. The 3D elements are created with [Three.js](https://www.npmjs.com/package/three) and the project uses [Cannon.js](https://www.npmjs.com/package/cannon) as a physics engine. The die are from [threejs-dice](https://github.com/byWulf/threejs-dice), which I modified to work with this project. In the future, I might update this project to use more modern physics engine and my own Dice manager.

To share the dice throws, Dice-mat uses third-party solution [Supabase](https://supabase.com)'s Realtime Pub/Sub system. This way the application can be hosted easily, without it's own backend. The application supports groups, which allows the throws to be broadcasted for only people in the same group.

The user preferences are saved on browser using localStorage and nothing but the throws are send to the server.

## Inspiration

Some of my inspirations for building and refactoring Dice-mat are:

- This project has been a way for me to practise using canvas and Three.js, while also touching on physics simulation and 3D objects.
- Refactoring this project to typescript has helped further my understanding of typescript and what it can do to the readability of code. It has also shown how much I have already improved during my coding career.
- Building the app with Next.js has helped me further extend my understanding of Next.js and React, especially with using and creating hooks and incorporating it with content not controlled by Next.js directly.

## Developing

First install dependencies

```bash
npm install
```

Add your Supabase Anon key and URL as environmental variables `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_URL`

Then you can run the development server using

```bash
npm run dev
```

The project will now be visible at [localhost:3000](http://localhost:3000)
