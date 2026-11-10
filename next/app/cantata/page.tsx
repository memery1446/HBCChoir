const VIDEO = "dxRGxkWxlp0";

export default function Cantata() {
    return (
        <>
            <header className="py-10 text-center text-white">
                <p className="eyebrow !text-white/80">Christmas Cantata</p>
                <h1
                    className="mt-3 text-3xl sm:text-4xl"
                    style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
                >
                    Candles &amp; Carols
                </h1>
            </header>

            <div className="card">
                <p>2026 Christmas Cantata Study Video - Our Presentation: Sunday morning, December 20, 2026</p>

                <div className="relative mt-6 aspect-video overflow-hidden rounded-lg bg-black">
                    <iframe
                        className="absolute inset-0 h-full w-full"
                        src={`https://www.youtube-nocookie.com/embed/${VIDEO}?rel=0`}
                        title="Candles & Carols: 2026 Christmas Cantata"
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            </div>
        </>
    );
}
