from __future__ import annotations

from datetime import datetime, timezone
from urllib.parse import quote

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import get_password_hash
from app.models.contribution import Contribution, ContributionType
from app.models.editorial import (
    EditorialObject,
    EditorialRelation,
    EditorialRelationType,
    EditorialType,
    Event,
    Person,
    Place,
)
from app.models.friendship import Friendship
from app.models.like import Like
from app.models.user import User, UserRole


def _media(path: str) -> str:
    return f"{get_settings().backend_public_url}/static/mock/{path}"


def _imported(path: str) -> str:
    return f"{get_settings().backend_public_url}/static/imported/{path}"


def _picture(path: str) -> str:
    encoded_path = quote(path, safe="/")
    return f"{get_settings().backend_public_url}/picture/{encoded_path}"


def _sync_existing_seed_assets(db: Session) -> None:
    asset_map = {
        "place-wurth": _picture("cards/five.png"),
        "person-tomi": _picture("cards/six.png"),
        "event-demolition": _picture("cards/one.png"),
        "event-chasse": _picture("cards/two.png"),
        "place-piscine": _picture("cards/four.png"),
        "event-parfum": _picture("cards/one.png"),
        "person-juliette": _picture("cards/three.png"),
        "place-collection": _picture("lété-au-musée-würth.mp4"),
    }

    objects = db.scalars(
        select(EditorialObject).where(EditorialObject.id.in_(list(asset_map.keys())))
    ).all()

    updated = False
    for item in objects:
        media_url = asset_map.get(item.id)
        if media_url and item.media_url != media_url:
            item.media_url = media_url
            updated = True

    if updated:
        db.commit()


def _ensure_seed_friendships(db: Session) -> None:
    seed_pairs = [("user-charles", "user-steve"), ("user-steve", "user-charles")]
    existing_pairs = {
        (entry.user_id, entry.friend_id) for entry in db.scalars(select(Friendship)).all()
    }

    missing_entries = [
        Friendship(user_id=user_id, friend_id=friend_id)
        for user_id, friend_id in seed_pairs
        if (user_id, friend_id) not in existing_pairs
    ]
    if missing_entries:
        db.add_all(missing_entries)
        db.commit()


def seed_database(db: Session) -> None:
    if db.scalar(select(User.id).limit(1)):
        existing_users = db.scalars(select(User)).all()
        updated_roles = False
        for user in existing_users:
            target_role = UserRole.MODERATOR if user.id == "user-charles" else UserRole.CONTRIBUTOR
            if user.role != target_role:
                user.role = target_role
                updated_roles = True
        if updated_roles:
            db.commit()
        _sync_existing_seed_assets(db)
        _ensure_seed_friendships(db)
        return

    users = [
        User(
            id="user-charles",
            username="Charles_11",
            email="charles@lela.local",
            hashed_password=get_password_hash("lela1234"),
            city="Strasbourg",
            avatar_url=_media("avatar-charles.svg"),
            role=UserRole.MODERATOR,
        ),
        User(
            id="user-steve",
            username="Steve_01",
            email="steve@lela.local",
            hashed_password=get_password_hash("lela1234"),
            city="Erstein",
            avatar_url=_media("avatar-steve.svg"),
            role=UserRole.CONTRIBUTOR,
        ),
    ]
    db.add_all(users)

    editorial_objects = [
        EditorialObject(
            id="place-wurth",
            type=EditorialType.PLACE,
            title="Musee Wurth | Erstein",
            subtitle="1 Rue du Bain aux Plantes, Strasbourg",
            description="Situe a Erstein, pres de Strasbourg, le Musee Wurth propose une immersion accessible et inspirante dans l'art moderne et contemporain.",
            narrative_text="A travers une programmation d'expositions temporaires de grande qualite, le musee met en dialogue des artistes majeurs et des talents emergents issus de la collection Wurth.",
            media_url=_picture("cards/five.png"),
            created_at=datetime(2026, 4, 5, 10, 0, tzinfo=timezone.utc),
            contributor_id="user-charles",
        ),
        EditorialObject(
            id="person-tomi",
            type=EditorialType.PERSON,
            title="Tomi Ungerer",
            subtitle="dessinateur, illustrateur et auteur",
            description="Jean-Thomas Ungerer, dit Tomi Ungerer, ne a Strasbourg, est une figure singuliere et transfrontaliere de l'illustration europeenne.",
            narrative_text="Considere comme l'un des plus brillants dessinateurs de sa generation, il a mene une carriere internationale ou le dessin editorial rencontrait l'enfance, la satire et la narration.",
            media_url=_picture("cards/six.png"),
            created_at=datetime(2026, 4, 5, 9, 0, tzinfo=timezone.utc),
            contributor_id="user-charles",
        ),
        EditorialObject(
            id="event-demolition",
            type=EditorialType.EVENT,
            title="Demolition Day",
            subtitle="Insolite",
            description="Le Casino Barriere Ribeauville imagine une animation spectaculaire basee sur un grand jeu de demolition et de tirages au sort.",
            narrative_text="Cette proposition evenementielle transforme le divertissement en capsule editoriale: le lieu, les gestes et les spectateurs s'entrelacent pour raconter un moment de ville.",
            media_url=_picture("cards/one.png"),
            created_at=datetime(2026, 4, 4, 18, 30, tzinfo=timezone.utc),
            contributor_id="user-charles",
        ),
        EditorialObject(
            id="event-chasse",
            type=EditorialType.EVENT,
            title="Merci mon lapin !",
            subtitle="Pour les enfants",
            description="Une chasse aux oeufs imaginee comme une capsule sensible entre musee, jardin et printemps, accessible aux familles en quete d'une sortie douce.",
            narrative_text="Le recit editorial met en avant les details qui font vivre l'experience: le paysage, les gestes des enfants, la surprise et la couleur comme fil de memoire.",
            media_url=_picture("cards/two.png"),
            created_at=datetime(2026, 4, 4, 17, 0, tzinfo=timezone.utc),
            contributor_id="user-charles",
        ),
        EditorialObject(
            id="place-piscine",
            type=EditorialType.PLACE,
            title="Quelques longueurs pour le plaisir",
            subtitle="Piscine du Wacken",
            description="Un bassin urbain, calme et clair, pour nager entre deux rendez-vous ou redecouvrir un quartier par le corps et le rythme.",
            narrative_text="Dans LE_LA, meme un equipement quotidien devient un point d'entree editorial: on part du lieu, on glisse vers ses usages, puis vers les personnes qui l'habitent.",
            media_url=_picture("cards/four.png"),
            created_at=datetime(2026, 4, 4, 11, 0, tzinfo=timezone.utc),
            contributor_id="user-steve",
        ),
        EditorialObject(
            id="event-parfum",
            type=EditorialType.EVENT,
            title="Parfum d'Etoiles",
            subtitle="le spectacle des 45 ans du Royal Palace",
            description="Un grand show a la fois populaire et flamboyant ou la scenographie dialogue avec le costume, la musique et la memoire du cabaret.",
            narrative_text="Cette carte met en avant la dimension spectaculaire du territoire: un evenement devient un noeud entre patrimoine vivant, imaginaire collectif et destination.",
            media_url=_picture("cards/one.png"),
            created_at=datetime(2026, 4, 3, 20, 0, tzinfo=timezone.utc),
            contributor_id="user-steve",
        ),
        EditorialObject(
            id="person-juliette",
            type=EditorialType.PERSON,
            title="Juliette Steiner",
            subtitle="Metteuse en scene, comedienne, directrice de compagnie",
            description="Une artiste qui traverse la scene, la transmission et la mise en recit de gestes fragiles ou puissants selon les contextes.",
            narrative_text="Sa presence dans le graphe editorial relie le spectacle vivant a des lieux, des collaborations et des moments de ville qui se racontent mieux ensemble que separes.",
            media_url=_picture("cards/three.png"),
            created_at=datetime(2026, 4, 3, 15, 0, tzinfo=timezone.utc),
            contributor_id="user-steve",
        ),
        EditorialObject(
            id="place-collection",
            type=EditorialType.PLACE,
            title="Tout savoir sur la collection Wurth",
            subtitle="Musee Wurth | Erstein",
            description="Une carte de mediation pour entrer dans la collection, ses parcours, ses dialogues et les artistes qu'elle fait emerger.",
            narrative_text="Le dispositif editorial de LE_LA permet d'aborder la collection comme une constellation de cartes: expositions, artistes, evenements et lieux se renvoient l'un a l'autre.",
            media_url=_picture("lété-au-musée-würth.mp4"),
            created_at=datetime(2026, 4, 3, 9, 0, tzinfo=timezone.utc),
            contributor_id="user-charles",
        ),
    ]
    db.add_all(editorial_objects)
    db.flush()

    places = [
        Place(
            editorial_object_id="place-wurth",
            address="1 Rue du Bain aux Plantes, Strasbourg",
            city="Strasbourg",
            latitude=48.488,
            longitude=7.716,
            opening_hours="Mar-Dim 10h-18h",
        ),
        Place(
            editorial_object_id="place-piscine",
            address="1 Rue Pierre de Coubertin, Strasbourg",
            city="Strasbourg",
            latitude=48.596,
            longitude=7.768,
            opening_hours="Lun-Dim 8h-20h",
        ),
        Place(
            editorial_object_id="place-collection",
            address="1 Rue du Bain aux Plantes, Strasbourg",
            city="Strasbourg",
            latitude=48.488,
            longitude=7.716,
            opening_hours="Mar-Dim 10h-18h",
        ),
    ]
    db.add_all(places)

    persons = [
        Person(
            editorial_object_id="person-tomi",
            name="Tomi Ungerer",
            role="dessinateur, illustrateur et auteur",
            biography="Illustrateur strasbourgeois majeur, auteur d'une oeuvre vaste, satirique et populaire.",
        ),
        Person(
            editorial_object_id="person-juliette",
            name="Juliette Steiner",
            role="metteuse en scene",
            biography="Figure du spectacle vivant en Alsace, croisant creation, pedagogie et direction de compagnie.",
        ),
    ]
    db.add_all(persons)

    events = [
        Event(
            editorial_object_id="event-demolition",
            event_date=datetime(2026, 4, 11, 21, 0, tzinfo=timezone.utc),
            price=20,
            location_id="place-wurth",
        ),
        Event(
            editorial_object_id="event-chasse",
            event_date=datetime(2026, 4, 5, 15, 0, tzinfo=timezone.utc),
            price=0,
            location_id="place-wurth",
        ),
        Event(
            editorial_object_id="event-parfum",
            event_date=datetime(2026, 4, 7, 20, 30, tzinfo=timezone.utc),
            price=42,
            location_id="place-piscine",
        ),
    ]
    db.add_all(events)

    relations = [
        EditorialRelation(
            source_id="event-chasse",
            target_id="place-wurth",
            relation_type=EditorialRelationType.LOCATED_AT,
        ),
        EditorialRelation(
            source_id="place-wurth",
            target_id="place-collection",
            relation_type=EditorialRelationType.RELATED,
        ),
        EditorialRelation(
            source_id="place-collection",
            target_id="person-tomi",
            relation_type=EditorialRelationType.MENTIONS,
        ),
        EditorialRelation(
            source_id="person-tomi",
            target_id="place-wurth",
            relation_type=EditorialRelationType.RELATED,
        ),
        EditorialRelation(
            source_id="event-demolition",
            target_id="place-wurth",
            relation_type=EditorialRelationType.HOSTS,
        ),
        EditorialRelation(
            source_id="person-juliette",
            target_id="event-parfum",
            relation_type=EditorialRelationType.CREATED_BY,
        ),
        EditorialRelation(
            source_id="place-piscine",
            target_id="event-parfum",
            relation_type=EditorialRelationType.RELATED,
        ),
    ]
    db.add_all(relations)

    likes = [
        Like(user_id="user-charles", editorial_object_id="place-wurth"),
        Like(user_id="user-charles", editorial_object_id="event-chasse"),
    ]
    db.add_all(likes)

    friendships = [
        Friendship(user_id="user-charles", friend_id="user-steve"),
        Friendship(user_id="user-steve", friend_id="user-charles"),
    ]
    db.add_all(friendships)

    db.add(
        Contribution(
            id="contribution-draft-1",
            user_id="user-charles",
            type=ContributionType.MAGAZINE,
            title="Strasbourg a hauteur de pas",
            subtitle="capsule urbaine",
            description="Une contribution deja en attente pour montrer le workflow contributeur.",
            media_name="placeholder.png",
            payload={"city": "Strasbourg"},
        )
    )
    db.commit()
