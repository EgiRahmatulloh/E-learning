# Test suite

Struktur test dipisahkan menurut targetnya:

- `backend/unit`: unit test yang hanya menguji kode `src/server`.
- `backend/integration`: integration test HTTP untuk endpoint `/api/*`.
- `frontend`: unit/contract test untuk kode client `src/lib` dan API browser.

Perintah yang tersedia:

```bash
bun run test                   # backend unit saja
bun run test:be:integration    # endpoint HTTP; perlu server test
bun run test:fe                # frontend/client
bun run test:all               # backend unit + frontend, tanpa integration
```

Jangan arahkan `BASE_URL` untuk integration test ke development atau production. Test tersebut membuat, mengubah, dan menghapus data, serta dapat mengunggah berkas. Jalankan server dengan `DATABASE_URL` yang menunjuk database test terpisah, kemudian arahkan `BASE_URL` ke server tersebut.

Test backend hanya boleh mengimpor `src/server/*` atau mengakses endpoint `/api/*`. Kode yang memakai DOM, `localStorage`, `FileReader`, atau modul client `src/lib/*` ditempatkan di `frontend`.
